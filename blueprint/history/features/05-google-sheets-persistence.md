# Feature: Google Sheets persistence

**From build-plan:** feature 5
**Status:** complete

## Goal

Give the signup somewhere to land. Today `joinWaitlist` validates a submission
and throws it away, so the page cannot be deployed. This feature puts every valid
signup into the Google Sheet as one row, behind a single typed `saveSignup()`
module, and makes a failed write loud and recoverable rather than silent.

## In scope

- `google-auth-library` as a dependency, service-account JWT auth against the
  Sheets REST `batchUpdate` endpoint with an `appendCells` request.
- `lib/sheets.ts`: `saveSignup(input)`, the only thing in the app that knows the
  sheet exists, plus a pure `toSheetRow()` that owns the column order.
- `created_at` and `consent_at` stamped inside the module, so one place owns the
  clock.
- Env var wiring: `GOOGLE_SHEETS_SPREADSHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`,
  `GOOGLE_PRIVATE_KEY`, read at call time, validated with a clear error.
- `.env.example` (un-ignored) and README setup notes covering the service
  account, sheet sharing, and the header row.
- `actions/waitlist.ts` awaiting `saveSignup()` before returning `success`.
- Failure handling: a request timeout, a structured recovery log line carrying
  the complete row, and the existing `failed` state shown to the visitor.

## Out of scope

- Duplicate-email detection, bot protection, retries or a queue. A failed write
  is logged for manual recovery, not retried.
- Any confirmation email.
- A stable per-signup id (an open question in the overview; row position stays
  the only identity for now).
- Reading from the sheet, an admin view, or export.
- Vercel env var configuration in the dashboard. That is feature 8.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Prerequisite (you, not the AI)

Steps 2 and 3 need real credentials to prove anything:

1. A Google Cloud project with the Sheets API enabled and a service account with
   a JSON key.
2. A Google Sheet whose first tab is named `Signups`, with a header row matching
   the column order below.
3. That sheet shared with the service account's email as **Editor**.
4. The three values in `.env.local`.

Step 1 can be built and reviewed without any of this. If the credentials are not
ready when steps 2 and 3 land, they get build evidence only and their done-when
stays unticked until you can run a real submit.

## Build steps

- [x] **Step 1 - dependency, env contract, and setup docs** - add
  `google-auth-library`; add `.env.example` listing the three vars with the
  `GOOGLE_PRIVATE_KEY` quoting gotcha called out; add a `!.env.example` negation
  to `.gitignore` (today `.env*` swallows it); add a README section covering
  service account creation, sheet sharing, and the exact header row.
  *Done when:* `npm run build` passes, `git check-ignore .env.example` reports
  nothing, and `.env.local` is still ignored.

- [x] **Step 2 - `lib/sheets.ts` with `toSheetRow()` and `saveSignup()`** -
  `toSheetRow(input, now)` returns the nine cells in locked order; `saveSignup()`
  reads and validates env, mints a JWT for
  `https://www.googleapis.com/auth/spreadsheets`, resolves the `Signups` tab's
  numeric `sheetId` (cached per spreadsheet), and POSTs one `batchUpdate` with an
  `appendCells` request typing each cell explicitly. A missing or malformed env
  var throws a named error before any network call. Module is
  `import "server-only"`.
  *Done when:* with real creds, a scripted call appends one row to `Signups`
  **immediately below the last row of real data**, whose nine cells are correct
  and in order, with `+44...` stored as text, `parity` as a number, and `consent`
  as a boolean.

  > **Amended mid-build (2026-08-25), approved.** Originally specified as
  > `values.append` with `valueInputOption: "RAW"`. That call locates the end of
  > the table by scanning for occupied cells, and it counts cells occupied by
  > *formatting* as well as data. The sheet has Alternating colours applied, a
  > banded range over `A1:I1003`, so the API reported `tableRange
  > Signups!A1:I1001` and wrote the row to `A1002`, returning HTTP 200 while
  > doing it. Anchoring at `A1` instead of `A:I` did not help. `appendCells`
  > appends after the last row holding actual data and ignores formatting, so it
  > survives the team restyling the sheet. It also types each cell rather than
  > relying on RAW string coercion.

- [x] **Step 3 - wire the action** - `joinWaitlist` awaits `saveSignup(signup)`
  before returning `success`, and the feature-4 placeholder comment goes.
  *Done when:* a real browser submit adds a row to the sheet and shows the
  confirmation panel echoing the first name and email; nothing is written when
  validation fails.

  > **Verified by the user in the browser (2026-08-25).** Playwright is not
  > installed and no browser tool was available, so the agent proved the action
  > layer only: three direct `joinWaitlist` calls, of which the one valid
  > submission wrote exactly one row and the two invalid ones wrote none. The
  > confirmation panel replacing the form was confirmed manually.

- [x] **Step 4 - never lose a signup** - an `AbortSignal.timeout` on the append
  so a hung Sheets call cannot hang the submit; a `console.error` recovery line
  carrying the complete row as JSON on any write failure; a non-2xx response
  raising rather than being swallowed.
  *Done when:* with `GOOGLE_SHEETS_SPREADSHEET_ID` set to a bad id, the form
  shows the failure message, the panel does not appear, and the server log
  contains one line holding every field of the attempted row.

## Files / areas

- `lib/sheets.ts` - new. The only module that knows about Google.
- `actions/waitlist.ts` - one `await`, one comment removed.
- `.env.example` - new.
- `.gitignore` - one negation line.
- `README.md` - setup section.
- `package.json` / `package-lock.json` - `google-auth-library`.

Nothing under `components/` or `app/` changes. The form, picker, and confirmation
panel are untouched.

## Data / contracts

**Load-bearing: the sheet's column order is the schema.** Features 7 and 8 and
any future migration depend on it. It matches `project-overview.md`:

| # | Column | Source | Format |
| --- | --- | --- | --- |
| A | `created_at` | module | ISO 8601, UTC, `toISOString()` |
| B | `first_name` | form | trimmed string |
| C | `last_name` | form | trimmed string |
| D | `email` | form | trimmed, lowercased |
| E | `phone` | form | E.164, e.g. `+447700900123` |
| F | `due_month` | form | `YYYY-MM` |
| G | `parity` | form | integer 1-5 |
| H | `consent` | form | boolean `true` |
| I | `consent_at` | module | ISO 8601, UTC |

`created_at` and `consent_at` take the same timestamp: consent is given at
submit, and there is no earlier moment to record.

The input type is the existing `WaitlistSignupInput` from `lib/waitlist-schema.ts`.
Do not redefine it. `saveSignup` returns `Promise<void>` and throws on failure;
the action already has the try/catch that turns a throw into the `failed` state.

## Testing

No test runner is configured (`AGENTS.md` Commands), so **the test gate is off**.
Verification is the build plus real evidence from the running app.

Per step:

- Step 1 - `npm run build`, plus `git check-ignore` on both `.env.example` and
  `.env.local`.
- Step 2 - a throwaway script under `scripts/` calling `saveSignup()` with a
  fixture, then the appended row read back in the sheet. Delete the script before
  `/complete`.
- Step 3 - a browser submit end to end, screenshot of the confirmation panel and
  the new sheet row.
- Step 4 - the deliberate bad-spreadsheet-id run, with the terminal output showing
  the recovery line.

If `/tests` is ever run, `toSheetRow()` is the piece worth covering: pure, ordered
output with assertable edge cases. It is deliberately split out from the network
call for that reason.

## Notes for the AI

- **Server only.** `lib/sheets.ts` starts with `import "server-only"`. A secret
  must never be reachable from a client component.
- **Read env at call time, not at module scope.** A module-scope throw breaks
  `npm run build` on a machine without credentials, which would take feature 8
  and every CI build down with it.
- **`GOOGLE_PRIVATE_KEY` newlines.** The value is pasted as one line with literal
  `\n`. Replace the escaped sequence with real newlines before handing it to the
  JWT client, or auth fails with an opaque error. Call this out in `.env.example`.
- **Type every cell explicitly.** `appendCells` takes a `userEnteredValue` per
  cell, so `phone` goes in as `stringValue` (never `numberValue`, which would
  turn `+447700900123` into a negative integer), `parity` as `numberValue`, and
  `consent` as `boolValue`.
- **Never use `values.append` here.** It locates the table by scanning for
  occupied cells and treats formatted-but-empty rows as occupied, so any
  alternating colours, filter, or banding on the sheet silently pushes new rows
  to the bottom of the grid while still returning HTTP 200.
- **No `googleapis`.** `google-auth-library` plus `fetch` against the REST
  endpoint, per the stack decision in `project-overview.md`. One call does not
  justify the full client.
- **The recovery log is the safety net,** not a nice-to-have: with no database
  and no retry, a failed append is only recoverable if the row is in the log.
  Log it as one structured line, and remember it contains personal and health
  data, so it stays server-side only.
- **The `failed` state and its copy already exist** in `actions/waitlist.ts` and
  the form. Do not invent new user-facing error text.
- No em dashes in code, comments, or docs (`coding-standards.md`).
