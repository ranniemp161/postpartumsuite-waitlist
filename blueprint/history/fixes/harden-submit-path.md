# Harden the submit path against spam and log leakage

**Type:** Fix

## The problem

Three separate weaknesses on the one path that accepts public input. None is
exploitable in the classic sense, but together they are what a waitlist page
actually gets attacked by.

1. **The failure log copies special category data.** `saveSignup()` in
   `lib/sheets.ts` logs the entire `SheetRow` on a write failure, so email,
   phone, `due_month` and `parity` land in the Vercel log store. `due_month`
   plus `parity` is pregnancy information, which is Article 9 health data. The
   project is careful about this everywhere else (self-hosted fonts, outward
   postcode only, access-restricted sheet), so this is the one place the
   minimised data gets a second, less controlled copy.

2. **Nothing distinguishes a bot from a mother.** `joinWaitlist` accepts any
   well-formed submission. Junk rows make the demand data the project exists to
   collect unreadable.

3. **No security headers.** `next.config.ts` is empty, so the page can be framed
   and has no CSP. Clickjacking matters here because the form collects health
   data.

Spam and denial of service are the same attack on this page: Google allows
roughly 60 write requests per minute per project, so a modest flood exhausts the
quota and genuine signups start hitting `FAILURE_MESSAGE`.

## The fix

Three small, independent changes. Must not break: the existing server-side
validation, the error-preserving form reset, or the "never silently lose a
signup" guarantee.

### Scope decision: honeypot only, no submit-time floor

The earlier suggestion paired the honeypot with a minimum time-to-submit check.
Dropping the timer. The form is a client component, so the render timestamp
would be client-supplied and therefore forgeable by anything more capable than
the bots the honeypot already catches. It would add state to a component with
delicate reset and revalidate logic and buy close to nothing. Rate limiting at
the platform edge is the right answer for the class of bot that would defeat a
honeypot, and that is account configuration, not code.

## Build steps

Progress (survives a context clear):

- [x] Step 1 - stop logging personal data on write failure
- [x] Step 2 - honeypot field
- [x] Step 3 - security headers

### Step 1 - stop logging personal data on write failure

Replace the full-row payload in the `WAITLIST_SIGNUP_UNSAVED` log with
non-identifying recovery detail: the failure reason, the `due_month`, the
`postcode_outward`, and a short SHA-256 prefix of the email as a correlation
handle. Keep the log line, the error class, and the rethrow exactly as they are.

The point is that an operator reading logs can still tell how many signups were
lost and roughly where, and can match a row to a visitor who writes in, without
the log itself becoming a second copy of the record.

Update the comment above it to say what is deliberately not logged and why.

**Done when:** forcing a Sheets failure (bad `GOOGLE_SHEETS_SPREADSHEET_ID`)
prints `WAITLIST_SIGNUP_UNSAVED` with no name, email, phone, or parity in it,
and the visitor still sees `FAILURE_MESSAGE`.

### Step 2 - honeypot field

Add one hidden decoy input to `WaitlistForm.tsx` and reject filled submissions
in `actions/waitlist.ts`.

- The field must be hidden with CSS, not `type="hidden"`, and carry
  `tabIndex={-1}`, `aria-hidden="true"`, and `autoComplete="off"` so it is
  invisible to a keyboard user, a screen reader, and browser autofill alike.
- Name it something a bot will target but autofill will not, and that is not in
  `WAITLIST_FIELDS`, so `parseWaitlistForm` keeps ignoring it.
- A filled honeypot returns `{ status: "success" }` without writing to the
  sheet. A bot must not learn that it was caught, and the visitor-facing branch
  is unchanged.
- Log the rejection so real submissions lost to a false positive are visible.

**Risk to note in the diff:** an aggressive autofill extension filling the decoy
would silently discard a real signup. The attribute set above is the mitigation;
the log line is how we would find out.

**Done when:** a normal submit still reaches the sheet, and a `curl` submit with
the decoy filled returns the success state with no new sheet row and a logged
rejection.

### Step 3 - security headers

Add a `headers()` block to `next.config.ts` covering all routes:

- `Content-Security-Policy` - fonts are self-hosted through `next/font/google`,
  so no external origin needs allowing. Next's App Router injects inline
  bootstrap scripts, so `script-src` needs `'unsafe-inline'` unless a nonce is
  wired through middleware; that is out of scope here. Set `frame-ancestors
  'none'`, `object-src 'none'`, `base-uri 'self'`, and a `default-src 'self'`.
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Content-Type-Options: nosniff`
- `Permissions-Policy` denying camera, microphone, and geolocation

**Done when:** `npm run build` passes, the page and `/privacy` render with no
CSP violation in the browser console, the month picker and parity pills still
work, and response headers show the five above.

## Verify

1. `npm run build`
2. `npm run dev`, submit the form normally, confirm the row reaches the sheet
   and the confirmation panel echoes the first name
3. Check the console on `/` and `/privacy` for CSP violations
4. Confirm the due date picker, parity pills, and inline errors still behave
5. Break `GOOGLE_SHEETS_SPREADSHEET_ID` and confirm the failure log carries no
   personal data

## Verification record

| Done-when | Proof |
| --- | --- |
| Redacted failure log | `WAITLIST_SIGNUP_UNSAVED` observed against a broken sheet id, carrying only reason, 8-char email handle, `due_month`, `postcode_outward`. Scanned for name, email, phone, `parity`, `row`: all absent |
| Honeypot skips the write | `joinWaitlist` called directly with and without the decoy: bot returned `success` with a `WAITLIST_SIGNUP_DISCARDED` line and no `WAITLIST_SIGNUP_UNSAVED`; human reached `saveSignup` and failed at Google |
| Headers on every route | `next start` responses for `/` and `/privacy` carried all five headers, with no `'unsafe-eval'` and no `ws:` in production |
| No external origins | Served markup references only `/_next/static/...`, so `font-src 'self'` needs no exception |
| Build | `npm run build` compiled and type-checked clean |
| Browser console clean | Checked by the user in DevTools on `/` and `/privacy`: no CSP violations |
| Form submits under the CSP | `POST / 200` from a real browser submit, so no directive blocks the Server Action |
| Month picker and parity pills work | Implied by the same submit. The honeypot check runs after validation, so reaching `WAITLIST_SIGNUP_DISCARDED` required `due_month` to parse as a valid non-past `YYYY-MM` and `parity` as an integer 1 to 3, which only the picker and the pills produce |
| Honeypot skips the write in the real app | Browser submit with the decoy set logged `WAITLIST_SIGNUP_DISCARDED` and no `WAITLIST_SIGNUP_UNSAVED`, confirming `saveSignup` was never reached |

Known limitation carried forward: `script-src` keeps `'unsafe-inline'` because the
App Router injects inline bootstrap scripts, so the CSP is not meaningfully an
XSS control. `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`,
and `form-action 'self'` are the directives doing real work. A nonce threaded
through middleware would close it.
