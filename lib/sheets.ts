import "server-only";

import { JWT } from "google-auth-library";

import type { WaitlistSignupInput } from "@/lib/waitlist-schema";

const SHEET_TAB = "Signups";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const API_ROOT = "https://sheets.googleapis.com/v4/spreadsheets";

// A signup the visitor is waiting on, so the whole exchange with Google gets one
// deadline rather than each call getting its own. Long enough for a cold JWT
// mint plus two round trips, short enough that a hung Google does not hold the
// submit open indefinitely.
const REQUEST_TIMEOUT_MS = 10_000;

// The ten cells of one signup, in the order the sheet's columns are fixed in.
// Positional, so a reordered sheet corrupts every later row: see the Data
// contract in project-overview.md before touching this.
//
// postcode_outward is appended last rather than sitting beside due_month where
// it belongs logically. Rows already in the sheet are fixed text; inserting a
// column mid-row would leave every earlier signup's values reading against the
// wrong headers. Column J needs its header cell added by hand.
export type SheetRow = [
  created_at: string,
  first_name: string,
  last_name: string,
  email: string,
  phone: string,
  due_month: string,
  parity: number,
  consent: boolean,
  consent_at: string,
  postcode_outward: string,
];

export class SheetsConfigError extends Error {
  name = "SheetsConfigError";
}

export class SheetsWriteError extends Error {
  name = "SheetsWriteError";
}

export function toSheetRow(input: WaitlistSignupInput, now: Date): SheetRow {
  // One timestamp for both columns: consent is given at submit, so there is no
  // earlier moment to record.
  const at = now.toISOString();

  return [
    at,
    input.first_name,
    input.last_name,
    input.email,
    input.phone,
    input.due_month,
    input.parity,
    input.consent,
    at,
    input.postcode_outward,
  ];
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new SheetsConfigError(`${name} is not set`);
  }
  return value;
}

// Read at call time, never at module scope: a throw during module evaluation
// would break `npm run build` on any machine without credentials, CI included.
function readConfig() {
  const privateKey = requireEnv("GOOGLE_PRIVATE_KEY").replace(/\\n/g, "\n");

  if (!privateKey.includes("BEGIN PRIVATE KEY")) {
    throw new SheetsConfigError(
      "GOOGLE_PRIVATE_KEY does not look like a PEM key. Check the quoting note in .env.example",
    );
  }

  return {
    spreadsheetId: requireEnv("GOOGLE_SHEETS_SPREADSHEET_ID"),
    clientEmail: requireEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    privateKey,
  };
}

type SheetsConfig = ReturnType<typeof readConfig>;

type CellValue = SheetRow[number];

function toCellData(value: CellValue) {
  if (typeof value === "number") return { userEnteredValue: { numberValue: value } };
  if (typeof value === "boolean") return { userEnteredValue: { boolValue: value } };
  return { userEnteredValue: { stringValue: value } };
}

interface SheetProperties {
  properties?: { sheetId?: number; title?: string };
}

// Google reports the useful part of a failure in the body, not the status line:
// a 403 says only "Forbidden", while the body names the missing share or the
// disabled API. Worth the extra read when a signup has just been lost.
async function describeFailure(response: Response): Promise<string> {
  let detail = response.statusText;
  try {
    const body: { error?: { message?: string } } = await response.json();
    if (body.error?.message) detail = body.error.message;
  } catch {
    // A non-JSON error body tells us nothing the status line does not.
  }
  return `${response.status} ${detail}`;
}

// google-auth-library takes no abort signal, so the shared deadline is applied
// by racing it. The underlying request may finish later and is simply dropped.
function untilAborted(signal: AbortSignal): Promise<never> {
  return new Promise((_, reject) => {
    signal.addEventListener(
      "abort",
      () => reject(new SheetsWriteError("Google did not respond in time")),
      { once: true },
    );
  });
}

// The tab's numeric id never changes for a given spreadsheet, and renaming the
// tab does not alter it, so one lookup per process is enough.
const sheetIdCache = new Map<string, number>();

async function resolveSheetId(
  spreadsheetId: string,
  token: string,
  signal: AbortSignal,
): Promise<number> {
  const cached = sheetIdCache.get(spreadsheetId);
  if (cached !== undefined) return cached;

  const response = await fetch(
    `${API_ROOT}/${spreadsheetId}?fields=sheets.properties(sheetId,title)`,
    { headers: { authorization: `Bearer ${token}` }, signal },
  );

  if (!response.ok) {
    throw new SheetsWriteError(
      `Could not read the spreadsheet: ${await describeFailure(response)}`,
    );
  }

  const body: { sheets?: SheetProperties[] } = await response.json();
  const sheetId = body.sheets?.find(
    (sheet) => sheet.properties?.title === SHEET_TAB,
  )?.properties?.sheetId;

  if (sheetId === undefined) {
    throw new SheetsConfigError(
      `The spreadsheet has no tab named "${SHEET_TAB}"`,
    );
  }

  sheetIdCache.set(spreadsheetId, sheetId);
  return sheetId;
}

async function appendRow(
  config: SheetsConfig,
  row: SheetRow,
  signal: AbortSignal,
): Promise<void> {
  const auth = new JWT({
    email: config.clientEmail,
    key: config.privateKey,
    scopes: [SCOPE],
  });

  const { token } = await Promise.race([
    auth.getAccessToken(),
    untilAborted(signal),
  ]);
  if (!token) {
    throw new SheetsWriteError("Google returned no access token");
  }

  const sheetId = await resolveSheetId(config.spreadsheetId, token, signal);

  // appendCells, not values.append: the latter finds the end of the table by
  // scanning for occupied cells and counts formatting as occupancy, so the
  // sheet's alternating colours pushed rows to the bottom of the grid while
  // still reporting success. appendCells goes after the last row of real data.
  const response = await fetch(`${API_ROOT}/${config.spreadsheetId}:batchUpdate`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        {
          appendCells: {
            sheetId,
            rows: [{ values: row.map(toCellData) }],
            fields: "userEnteredValue",
          },
        },
      ],
    }),
    signal,
  });

  if (!response.ok) {
    throw new SheetsWriteError(
      `Sheets append failed: ${await describeFailure(response)}`,
    );
  }
}

export async function saveSignup(input: WaitlistSignupInput): Promise<void> {
  const row = toSheetRow(input, new Date());

  try {
    await appendRow(readConfig(), row, AbortSignal.timeout(REQUEST_TIMEOUT_MS));
  } catch (error) {
    // The last line of defence. There is no database and no retry queue, so if
    // this line is not written the signup is gone. Server logs only: the row
    // carries personal data and, in due_month plus parity, health data.
    console.error(
      "WAITLIST_SIGNUP_UNSAVED",
      JSON.stringify({
        reason: error instanceof Error ? error.message : String(error),
        row,
      }),
    );
    throw error;
  }
}
