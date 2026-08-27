import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { JWT } from "google-auth-library";

import {
  DATE_TIME_PATTERN,
  isSheetDateTime,
  toSheetDateTime,
  type SheetDateTime,
} from "@/lib/sheet-datetime";
import type { WaitlistSignupInput } from "@/lib/waitlist-schema";

const SHEET_TAB = "Signups";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const API_ROOT = "https://sheets.googleapis.com/v4/spreadsheets";

// A signup the visitor is waiting on, so the whole exchange with Google gets one
// deadline rather than each call getting its own. Long enough for a cold JWT
// mint plus two round trips, short enough that a hung Google does not hold the
// submit open indefinitely.
const REQUEST_TIMEOUT_MS = 10_000;

// The eleven cells of one signup, in the order the sheet's columns are fixed in.
// Positional, so a reordered sheet corrupts every later row: see the Data
// contract in project-overview.md before touching this.
//
// postcode_outward and signup_id are appended rather than sitting where they
// belong logically. Rows already in the sheet are fixed text; inserting a column
// mid-row would leave every earlier signup's values reading against the wrong
// headers. Columns J and K need their header cells added by hand.
//
// A random uuid rather than a time-sortable id: created_at already orders the
// sheet, so sortability would buy nothing and cost a hand-rolled encoder. Its
// job is to survive a row moving, which row position cannot.
export type SheetRow = [
  created_at: SheetDateTime,
  first_name: string,
  last_name: string,
  email: string,
  phone: string,
  due_month: string,
  parity: number,
  consent: boolean,
  consent_at: SheetDateTime,
  postcode_outward: string,
  signup_id: string,
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
  const at = toSheetDateTime(now);

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
    randomUUID(),
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
  if (isSheetDateTime(value)) {
    return {
      userEnteredValue: { numberValue: value.serial },
      userEnteredFormat: {
        numberFormat: { type: "DATE_TIME", pattern: DATE_TIME_PATTERN },
      },
    };
  }
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
            // Scoped to numberFormat rather than the whole of userEnteredFormat:
            // a broader mask would reset every other formatting property on the
            // cells it writes.
            fields: "userEnteredValue,userEnteredFormat.numberFormat",
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

// A handle for matching a lost signup to a visitor who writes in, without the
// log becoming a second copy of the record. Truncated because it only ever has
// to be unique against the handful of rows one outage loses, and a full digest
// of a low-entropy value like an email is closer to the address itself.
function emailHandle(email: string): string {
  return createHash("sha256").update(email).digest("hex").slice(0, 8);
}

export async function saveSignup(input: WaitlistSignupInput): Promise<void> {
  const row = toSheetRow(input, new Date());

  try {
    await appendRow(readConfig(), row, AbortSignal.timeout(REQUEST_TIMEOUT_MS));
  } catch (error) {
    // The last line of defence. There is no database and no retry queue, so if
    // this line is not written the signup is gone.
    //
    // Deliberately not the row. Name, email, phone and parity stay out of the
    // log store, because due_month plus parity is pregnancy information and so
    // special category data under UK GDPR Article 9, and the log store has its
    // own retention and its own reader list. What is left is pseudonymous and
    // is the minimum an operator needs: how many signups an outage lost, which
    // areas they came from, and enough of a handle to answer a visitor who
    // asks whether hers arrived.
    console.error(
      "WAITLIST_SIGNUP_UNSAVED",
      JSON.stringify({
        reason: error instanceof Error ? error.message : String(error),
        signup_id: row[10],
        email_handle: emailHandle(input.email),
        due_month: input.due_month,
        postcode_outward: input.postcode_outward,
      }),
    );
    throw error;
  }
}
