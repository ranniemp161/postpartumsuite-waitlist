import "server-only";

import type { SavedSignup } from "@/lib/sheets";
import type { WaitlistSignupInput } from "@/lib/waitlist-schema";

// Its own deadline rather than a share of the Sheets one: the visitor is
// already past the save that matters, so a slow CRM should cost them seconds,
// not the full ten Google gets.
const REQUEST_TIMEOUT_MS = 5_000;

// The sheet's names, with the two renames the client's function expects:
// parity is baby_status and postcode_outward is location.
export interface ZohoPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  due_month: string;
  baby_status: number;
  consent: boolean;
  consent_at: string;
  location: string;
  signup_id: string;
}

// ISO 8601 against the London wall clock with its real offset, because the
// team reads these times as UK local time and a bare UTC "Z" would show every
// summer signup an hour early. Intl carries the BST/GMT rules, and h23 stops
// midnight being reported as hour 24.
function toLondonIso(at: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZoneName: "longOffset",
  }).formatToParts(at);

  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  // longOffset reads "GMT+01:00" in summer and a bare "GMT" in winter.
  const offset = part("timeZoneName").replace("GMT", "") || "+00:00";

  return (
    `${part("year")}-${part("month")}-${part("day")}` +
    `T${part("hour")}:${part("minute")}:${part("second")}${offset}`
  );
}

export function toZohoPayload(
  input: WaitlistSignupInput,
  saved: SavedSignup,
): ZohoPayload {
  return {
    first_name: input.first_name,
    last_name: input.last_name,
    email: input.email,
    phone: input.phone,
    due_month: input.due_month,
    baby_status: input.parity,
    consent: input.consent,
    consent_at: toLondonIso(saved.created_at),
    location: input.postcode_outward,
    signup_id: saved.signup_id,
  };
}

// Zoho functions can answer 200 and still report that the function failed, so
// the status alone proves nothing. The envelope checked here is Zoho's usual
// one, `{ "code": "success", ... }`, and is an assumption until the client
// sends a real response: anything that does not match counts as a failure,
// which costs a log line, never a lost signup.
function reportsSuccess(body: unknown): boolean {
  if (typeof body !== "object" || body === null) return false;
  const code = (body as { code?: unknown }).code;
  return typeof code === "string" && code.toLowerCase() === "success";
}

// Fixed strings only. A fetch error message can embed the request URL, and
// this URL carries the API key, so nothing from the error itself is logged.
async function attempt(
  url: string,
  input: WaitlistSignupInput,
  saved: SavedSignup,
): Promise<string | null> {
  try {
    // Built inside the try, so a failure while shaping the payload is
    // swallowed like any other and cannot escape to the action.
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(toZohoPayload(input, saved)),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) return `http_${response.status}`;

    const body: unknown = await response.json().catch(() => null);
    return reportsSuccess(body) ? null : "unclear_response";
  } catch (error) {
    return error instanceof Error && error.name === "TimeoutError"
      ? "timeout"
      : "network";
  }
}

// Never throws. The Sheet is the record, so a CRM that is down, slow or
// confused must not turn a saved signup into an error the visitor sees. Skipped
// when no URL is configured, which is how Production stays untouched until the
// live URL is deliberately added.
export async function syncToZoho(
  input: WaitlistSignupInput,
  saved: SavedSignup,
): Promise<void> {
  const url = process.env.ZOHO_WAITLIST_URL?.trim();
  if (!url) return;

  const reason = await attempt(url, input, saved);
  if (reason === null) return;

  // The signup_id is enough to find the Sheet row and replay it by hand. No
  // name, email, phone, due month or URL: this is the log store, which has its
  // own retention and readers (UK GDPR Article 9 data stays out of it).
  console.error(
    "WAITLIST_SIGNUP_UNSYNCED",
    JSON.stringify({ reason, signup_id: saved.signup_id }),
  );
}
