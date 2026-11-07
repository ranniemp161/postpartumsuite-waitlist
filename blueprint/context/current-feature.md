# Feature: Zoho CRM sync

**From build-plan:** feature 9
**Status:** not started

## Goal

Send every successful signup to Zoho CRM as well as the Google Sheet, so the team
can follow up inside the CRM. The Sheet stays the source of truth and a Zoho
failure never reaches the visitor. An optional test-tab setting lets Preview and
local development run the whole path with fake data without touching real rows.

## In scope

- Generate `signup_id` and the timestamp once, and share them between the Sheet
  row and the Zoho payload
- `saveSignup()` returns the saved signup's identity so the action can reuse it
- Optional `GOOGLE_SHEETS_TAB` env var (default `Signups`), with the sheet-id cache
  keyed by spreadsheet and tab
- A server-only Zoho module: build the JSON payload, POST it with its own timeout,
  judge success from status and body, log a failure without personal data
- Call it from the Server Action straight after `saveSignup()`, skipped when
  `ZOHO_WAITLIST_URL` is unset
- `/privacy` names Zoho and the deletion wording covers both stores
- `.env.example` and README document the two new optional vars
- Verification against the Zoho sandbox URL with fake signups in a test tab

## Out of scope

- A retry queue or replay script for unsynced signups (the log line carries the
  `signup_id` so one can be built later)
- Importing or backfilling any existing Sheet rows into Zoho
- A new API route (the Server Action is already server-side)
- Changing validation, the form, or the confirmation panel
- Switching Production to the live Zoho URL (a separate, explicit step once the
  client confirms the sandbox lead)
- A unit test runner (none is configured, so the test gate is off)

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - Share the signup identity** - `toSheetRow` takes the signup id and
  timestamp instead of generating them. `saveSignup()` generates both once and
  returns `{ signup_id, created_at }`. No behaviour change for the Sheet. *Done
  when:* `npm run build` passes, the diff touches only `lib/sheets.ts` and its
  callers, and a signup submitted locally still appends the same 13 columns.
- [x] **Step 2 - Configurable sheet tab** - read optional `GOOGLE_SHEETS_TAB`
  (trimmed, default `Signups`) and key `sheetIdCache` on spreadsheet plus tab.
  *Done when:* with the var unset a signup lands in `Signups`; with it set to the
  test tab a signup lands there and `Signups` is untouched; a missing tab name
  still raises the existing `SheetsConfigError`.
- [x] **Step 3 - Zoho module** - `lib/zoho.ts` (`import "server-only"`):
  `toZohoPayload(input, saved)` returning the ten keys from the contract below
  (renames applied, `consent_at` as ISO 8601 with a London offset), and
  `syncToZoho()` which POSTs JSON with `AbortSignal.timeout(5000)`, treats a
  non-2xx status, a timeout, a network error, or a body that does not clearly
  report success as a failure, and never throws. Failure logs
  `WAITLIST_SIGNUP_UNSYNCED` with `signup_id`, a short reason, and nothing else
  (no email, name, phone, or URL). *Done when:* `npm run build` passes and a
  throwaway call against an unreachable URL logs one `WAITLIST_SIGNUP_UNSYNCED`
  line, contains no personal data or URL, and returns normally.
- [x] **Step 4 - Wire it into the action** - in `actions/waitlist.ts`, after
  `saveSignup()` resolves, call `syncToZoho()` when `ZOHO_WAITLIST_URL` is set.
  The honeypot branch and the Sheet-failure branch must not reach it. *Done
  when:* with the var unset nothing changes; with it set to the sandbox URL a fake
  signup creates a lead in Zoho sandbox and a row in the test tab with the same
  `signup_id`; with it set to a bad URL the visitor still sees the thank-you panel
  and the log shows the unsynced line.
- [x] **Step 5 - Privacy page and docs** - update `app/privacy/page.tsx` so "Where
  it is kept" names Zoho CRM as well as the Sheet, and the deletion paragraph says
  both are cleared. Add the two optional vars to `.env.example` with a note that
  `ZOHO_WAITLIST_URL` contains a key. *Done when:* `/privacy` renders with the new
  wording and no em dashes, and `.env.example` lists both vars with no real value.
- [ ] **Step 6 - Sandbox verification** - run the checks in Testing below on a
  Preview deployment or local dev with the test tab and sandbox URL. *Done when:*
  every check below passes and the client has seen the sandbox lead.

## Files / areas

- `lib/sheets.ts` - shared identity, tab setting, cache key
- `lib/zoho.ts` - new
- `actions/waitlist.ts` - the call site
- `app/privacy/page.tsx` - wording
- `.env.example`, `README.md` - new optional vars
- No change to `lib/waitlist-schema.ts`, the form components, or `next.config.ts`
  (the call is server-side, so the CSP is unaffected)

## Data / contracts

**Load-bearing: the Zoho payload.** JSON, `Content-Type: application/json`.

| Key | Source | Notes |
| --- | --- | --- |
| `first_name` | `first_name` | as stored |
| `last_name` | `last_name` | as stored |
| `email` | `email` | lowercased, as stored |
| `phone` | `phone` | E.164 |
| `due_month` | `due_month` | `YYYY-MM` |
| `baby_status` | `parity` | integer 1 to 3 |
| `consent` | `consent` | boolean `true` |
| `consent_at` | submit instant | ISO 8601 with London offset, for example `2026-11-07T14:05:00+00:00`. **Unconfirmed with the client** |
| `location` | `postcode_outward` | outward code only |
| `signup_id` | shared uuid | the same value as Sheet column K |

**Env vars (both optional):**

- `GOOGLE_SHEETS_TAB` - defaults to `Signups`
- `ZOHO_WAITLIST_URL` - full function URL including its key. Never logged, never
  committed, never sent to the browser

**`saveSignup()` return type:** `{ signup_id: string; created_at: Date }`.

**Environment matrix:**

| Environment | `GOOGLE_SHEETS_TAB` | `ZOHO_WAITLIST_URL` |
| --- | --- | --- |
| Local | test tab | sandbox URL |
| Vercel Preview | test tab | sandbox URL |
| Vercel Production | unset | unset until the client confirms |

Scope both vars to Preview only in Vercel, never "All Environments".

## Testing

No test runner is configured, so the test gate is off. If it is ever turned on,
`toZohoPayload` (key renames, ISO timestamp, no extra keys) is the logic to cover.

Verify with the running app and the build:

1. `npm run build` and `npm run lint` pass after each step.
2. **Unset check:** with both vars unset, a signup writes to `Signups` only and no
   Zoho call is made.
3. **Happy path:** with the test tab and sandbox URL, submit a fake signup (name
   "Test Signup", `@example.com` email, `07700 900xxx` phone). Confirm one row in
   the test tab, one lead in Zoho sandbox, and the same `signup_id` in both.
4. **Duplicate:** submit the same email twice. Two Sheet rows, one Zoho lead.
5. **Zoho failure:** set a deliberately wrong URL. The visitor sees the thank-you
   panel, the Sheet row exists, and the log shows `WAITLIST_SIGNUP_UNSYNCED` with
   the `signup_id` and no personal data or URL.
6. **Sheet failure:** break the Sheet config. The visitor sees the failure message
   and no Zoho call is made.
7. **Honeypot:** a filled honeypot reaches neither store.
8. **Production safety:** confirm Production has neither var set before deploying.
9. Open `/privacy` and read the new wording.

## Notes for the AI

- Next.js 16 differs from older training data. Read the relevant guide in
  `node_modules/next/dist/docs/` before changing the action.
- Keep `saveSignup()` the single persistence seam for the Sheet. The Zoho module is
  a sibling, called from the action, not folded into `sheets.ts`.
- `syncToZoho()` must never throw and must never log the URL, the payload, or any
  field value. `fetch` errors can embed the URL, so log a fixed reason string, not
  `error.message`.
- Do not call the real Zoho URL while building. Use only a URL the user supplies
  in an env var, and never print it. The one in the chat history is a sandbox key
  that should be rotated after testing.
- Comments explain why only. No em dashes anywhere (docs, comments, commits).
- Do not commit without permission. Branch name: `feature/zoho-crm-sync`.
