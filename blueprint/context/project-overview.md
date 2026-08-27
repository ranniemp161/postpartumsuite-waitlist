# PostpartumSuite Waitlist - Project Overview

> A single-page, design-led waitlist that collects expectant mothers' details for
> The Postpartum Suite and appends each signup to a Google Sheet.

## Problem

The Postpartum Suite opens postpartum care places area by area and cannot serve
everyone at once. There is no way today for an expectant mother to register
interest, and no way for the business to see where demand is concentrated before
committing to an area. This page captures interest while intent is high and
collects the structured data (due month, parity, phone area) needed to decide
where to open next and whom to contact first.

It is not the product: no booking, scheduling, payment, or accounts.

## Users

- **Expectant and new mothers in the UK** (anonymous, no auth). Usually second or
  third trimester. Typically on a phone, one-handed, often tired, with low
  friction tolerance. Frequently do not know an exact due date, only the month.
- **The Postpartum Suite team** (no app access). They read the Google Sheet
  directly to decide where to open and whom to contact.

There are no accounts and no signed-in state anywhere in this project.

## Features

In `build-plan.md` order. Feature 1 is the headline: the design is the
requirement everything else is judged against, so the look lands before behaviour.

1. **Design foundation** - `@theme` tokens, self-hosted fonts, logo mark, and
   site icon. Originally the embossed-paper system; replaced wholesale by the
   flat redesign (see UI/UX).
2. **Waitlist form shell** - the complete static form. No validation, no submit.
3. **Due date month picker** - year stepper plus 3x4 month grid in a popover,
   past months disabled, keyboard operable.
4. **Validation and submit states** - one shared Zod schema, inline errors,
   submitting state, and the confirmation panel that replaces the form.
5. **Google Sheets persistence** - `saveSignup()` behind one typed module, with
   failure handling that never silently loses a signup.
6. **Privacy policy page** - `/privacy`, linked from the consent checkbox.
7. **Responsive and accessibility pass** - narrow screens, focus rings, aria
   wiring, reduced motion.
8. **Deployment readiness** - Vercel config, London region, env vars, smoke test.

Logged separately under `blueprint/history/fixes/`, not build-plan items:

- **Flat redesign, plus outward postcode field** - the client replaced the visual
  direction after feature 7 and added a location field. Reskinned every surface
  and added `postcode_outward` as sheet column J.

Out of scope for the MVP: accounts, login, booking, payments, admin dashboard,
email sending, analytics, bot protection, duplicate detection, i18n, dark mode.

## Data model

One record per signup. No relationships, no accounts, therefore no per-user
authorisation model. The store is a Google Sheet, so the **column order below is
the schema** and later features depend on it.

### WaitlistSignup (one sheet row)

- `created_at` (Sheets datetime) - server-generated at submit, displayed
  `DD-MM-YYYY HH:mm` against a UK clock
- `first_name` (string, required)
- `last_name` (string, required)
- `email` (string, required) - validated, stored lowercased
- `phone` (string, required) - E.164, for example `+447700900123`
- `due_month` (string, required) - `YYYY-MM`, past months rejected
- `parity` (integer, required) - 1 to 3, where 3 means "third or more"
- `consent` (boolean, required) - must be true to submit
- `consent_at` (Sheets datetime) - when consent was given, same format
- `postcode_outward` (string, required) - the outward code only, for example
  `SW7`. Column J, whose header cell in the sheet reads `location`
- `signup_id` (string, required) - server-generated uuid, the only stable
  identity a row has. Column K

> **Locked shapes.** `due_month` is `YYYY-MM`, never a full date. `parity` is an
> integer 1 to 3, never a label string. `phone` is always E.164.
> `postcode_outward` is the outward code only, never a full postcode.

> **Timestamps are datetimes, never formatted strings.** `created_at` and
> `consent_at` are written as real Sheets datetimes (a serial number plus a
> `dd-mm-yyyy hh:mm` number format), rendered against `Europe/London`. Writing
> the display text directly would sort the column by day of month, so every
> sort, filter and chart built on the sheet would be quietly wrong. Rows written
> before this change remain ISO text, so both columns hold a mix.

> **Duplicate emails are allowed** and deduplicated on read, never rejected on
> write. `saveSignup()` has no retry queue, so a failed write sends the visitor
> back to resubmit; rejecting would refuse that second attempt on the strength
> of a first that never landed, and would tell an anonymous visitor whether an
> email is already on a list that reveals pregnancy.

> **The sheet's column J header reads `location`, not `postcode_outward`.**
> Deliberate: the code is positional so the header is only ever read by the
> team, and `location` is the wording the client used. Do not "correct" it to
> match the field name.

> **Retention** is the recorded due month plus eighteen months, or sooner on
> request, stated on `/privacy`. The sweep is manual; nothing deletes on a
> schedule.

> **`postcode_outward` sits last on purpose.** It belongs beside `due_month`
> logically, but rows written before it existed are fixed text in the sheet, and
> inserting a column mid-row would leave every earlier signup reading against the
> wrong headers. Append new columns; never insert one.

**Sensitivity.** Due month plus parity is pregnancy information, which is health
data and special category data under UK GDPR Article 9. Consent is explicit,
timestamped, and never pre-ticked; the sheet stays access-restricted; fonts are
self-hosted so no visitor IP reaches a third-party CDN.

Location is deliberately coarse. A full UK postcode identifies roughly fifteen
addresses; an outward code covers a district of roughly eight thousand. Only the
outward code is stored, and a visitor who types a full postcode has the inward
half discarded before anything is written, which is the data minimisation UK GDPR
Article 5(1)(c) asks for.

All persistence sits behind a single typed `saveSignup(input)` module so the
sheet can be replaced without touching the form, validation, or confirmation.

## Tech stack

- **Next.js 16 (App Router)** - the app; server components by default
- **React 19** - UI
- **TypeScript (strict)** - no `any`
- **Tailwind CSS v4** - styling, CSS-first `@theme` config, no `tailwind.config.js`
- **Server Action** - the single submit path; no API route is needed
- **Zod** - one schema shared by client and server validation
- **google-auth-library + Sheets REST** - service-account row append, chosen over
  full `googleapis` for a single call
- **next/font/google** - self-hosts Bodoni Moda, EB Garamond, and IBM Plex Sans
  400 (the button label, the only sans on the page)
- **npm** - package manager

Deliberately absent: ORM, database, auth, component library, state management,
animation library.

Testing: no runner configured, so the Blueprint test gate is off. If it is turned
on, the validation schema and the phone and month helpers are the logic worth
covering.

## Monetization

Not in v1, and it should not try to be. The value is de-risking: a warm list
segmented by area and due month so the first locations open against evidenced
demand. Revenue comes later from the Postpartum Suite service itself, outside
this project.

## UI/UX

**Design authority: `UI-design/Homepage-v2.jpeg`.** The client replaced the
embossed-paper direction after feature 7 shipped, so the earlier references
(`Homepage.png`, `design-token.png`, `design-elements.html`,
`design-system-spec.md`) describe a design that is no longer built. They are kept
as history; do not build from them.

The mockup is a 2x render of a roughly 470px viewport, so every measurement below
is a sampled pixel halved rather than an estimate. Where anything disagrees with
the mockup, the mockup wins, except the approved deviations below.

### Approved deviations from the mockup

| Deviation | Mockup | Built | Why |
| --- | --- | --- | --- |
| Name | one combined field | first + last, side by side | confirmation echoes first name reliably |
| Due date | `DD / MM / YYYY` free text | `MM / YYYY` trigger opening a year stepper + month grid, stores `YYYY-MM` | a due date is an estimate, and the sheet column is locked on the month |
| Parity pills | absent (mockup crops at the button) | kept, restyled | parity is the demand signal the project exists to gather |
| Consent row | absent (same crop) | kept, restyled | explicit consent is a UK GDPR Article 9 requirement, not a style choice |
| Field border | `#C1C1C1` (1.9:1, below the 3:1 WCAG 1.4.11 asks of a control boundary) | `#C1C1C1` | the design wins; compensated with a darker hover and a navy border on focus, not the halo alone. Raise `--color-line` to `#949494` if this is ever reversed |

The parity pills and consent row have no reference image at all. They are drawn
in the flat design's own language rather than invented: a field border at rest,
the button's navy when chosen.

### Character

Flat print on white. No texture, no card, no relief. Depth is not modelled at
all: a control is separated from the page by a single hairline border, and the
one saturated element is the button. High-contrast serif display type over a
light hairline structure.

### Key values

- Ground `#FFFFFF`, ink `#000000`, ink-soft `#4A4A4A`, placeholder `#858585`
- Field border `#C1C1C1`, rule `#D8D8D8`, navy `#194575`, oxblood accent `#7A2E2E`
- The design specifies no error state, so the oxblood is carried over from the
  paper palette for messages and invalid borders. 5.9:1 on white
- Content column max-width 620px, no card, radius 4px on fields and button
- Form gap 24px, label gap 11px, label-to-hint gap 5px
- Fields 40px tall (`9px 12px` padding), button 41.5px (`11px`), dial select
  134px with a 15px gutter
- Type: Bodoni Moda for the wordmark, tagline, field labels (bold caps, 11.5px,
  `0.14em`), and policy headings; EB Garamond for body copy and italic
  placeholders; IBM Plex Sans 400 for the button label only
- Selected means one thing everywhere: a chosen month and a chosen parity pill
  are both solid navy with a white label
- Logo at 112px, a flat `<img>` of `public/logo.png`
- Motion only on the button, 120ms ease on background-colour and transform
- **Light theme only.** No dark variant is specified.

### Routes

- `/` - the waitlist page. Form, then confirmation panel replacing it in place on
  success, echoing first name. No navigation on submit.
- `/privacy` - the privacy policy, same flat theme, linked from the consent
  checkbox and the footer.

### Accessibility

Real `<label>` on every field; placeholders never carry required information;
navy focus ring on all interactive elements, with the field border darkening to
navy as well so focus never rests on a faint halo alone; the area field's hint
stays on `aria-describedby` alongside its error, so an error never costs the
visitor the explanation; parity pills are an arrow-key navigable radio group;
month picker closes on Escape; errors announced, not colour-only;
`prefers-reduced-motion` disables the button transition.

The one known gap is the field border contrast recorded in the deviations table
above.

## Deployment

- **Host:** Vercel
- **Region:** London (`lhr1`), keeping signup data in the UK
- **App type:** Next.js 16 App Router, one Server Action
- **Build:** `npm run build`
- **Start:** handled by Vercel
- **Env vars:** `GOOGLE_SHEETS_SPREADSHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`,
  `GOOGLE_PRIVATE_KEY`
- **Database / storage:** none (Google Sheet, external)
- **Workers or cron:** none
- **Health check:** the root route
- **Domain:** www.thepostpartumsuite.com
- **Region config lives in `vercel.json`**, not the dashboard. Hobby allows a
  single function region; more than one fails before the build step

**Smoke test after a production deploy.** Reflects the sheet as it is now:
eleven columns, `DD-MM-YYYY HH:mm` timestamps, and a `signup_id`.

1. Load `/` in a real browser with the console open. No CSP violations.
2. Exercise the due-date picker and the parity radios.
3. Submit one signup with obviously-test details.
4. Confirm a row appends with eleven columns: readable datetimes in A and I, the
   outward code in J under its `location` header, and a uuid in K.
5. Delete the test row.
6. Load `/privacy` and confirm it renders.
7. Confirm `x-vercel-id` on a POST to `/` carries an `lhr1` prefix. Only the
   function is regional; a GET is served from the CDN and proves nothing.

**An automated check against `/` returns HTTP 429**, with
`X-Vercel-Mitigated: challenge` and a Vercel Security Checkpoint page. That is
Bot Protection challenging non-browser clients, not an outage. Any uptime
monitor pointed here will report the site down while it is healthy.

Preview deployment per feature branch. Production deploy stays explicit;
`/release vercel` prepares config but never deploys on its own.

## Open questions

Gaps and mismatches carried from the plans. Resolve in the plans, then re-run
`/overview`.

- **The mockup crops at the button.** `Homepage-v2.jpeg` shows nothing below
  `JOIN WAITLIST`, so the parity pills, the consent row, and the confirmation
  panel are built in the design's language rather than matched to a reference.
  Ask the client for the full-height design.
- **Field borders are below the WCAG non-text minimum.** `#C1C1C1` is 1.9:1 on
  white where 1.4.11 asks 3:1. Kept knowingly, recorded in the deviations table.
  `--color-line: #949494` reverses it in one line.
- **The area field's label wording.** The client wrote
  "Your Location (first part of your poste code)"; the build uses "Your area"
  with the explanation as a hint line, because a parenthetical that long in
  letterspaced caps runs very wide. Confirm which she wants.
- **Privacy policy wording** needs a human author, not generated text. The page
  is a factual account of what the code does, not reviewed by anyone qualified.
- **Retention is stated but not enforced.** `/privacy` promises deletion at due
  month plus eighteen months, and nothing deletes on a schedule. Either someone
  runs the sweep or the page makes a promise the system does not keep.
- **Migration off Sheets** is triggered by need, not row count: the first time a
  signup needs per-signup state (contacted, offered, declined).
