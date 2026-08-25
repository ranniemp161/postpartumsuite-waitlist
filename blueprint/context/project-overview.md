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

1. **Design foundation** - the CSS specification transcribed into real code:
   `@theme` tokens, self-hosted fonts, the `#kerf` SVG filter, generated texture
   tiles, logo mark, and site icon.
2. **Waitlist form shell** - the complete static form matching `Homepage.png`. No
   validation, no submit.
3. **Due date month picker** - year stepper plus 3x4 month grid in the spec's
   popover, past months disabled, keyboard operable.
4. **Validation and submit states** - one shared Zod schema, inline errors,
   submitting state, and the confirmation panel that replaces the form.
5. **Google Sheets persistence** - `saveSignup()` behind one typed module, with
   failure handling that never silently loses a signup.
6. **Privacy policy page** - `/privacy`, linked from the consent checkbox.
7. **Responsive and accessibility pass** - narrow screens, focus rings, aria
   wiring, reduced motion.
8. **Deployment readiness** - Vercel config, London region, env vars, smoke test.

Out of scope for the MVP: accounts, login, booking, payments, admin dashboard,
email sending, analytics, bot protection, duplicate detection, i18n, dark mode.

## Data model

One record per signup. No relationships, no accounts, therefore no per-user
authorisation model. The store is a Google Sheet, so the **column order below is
the schema** and later features depend on it.

### WaitlistSignup (one sheet row)

- `created_at` (ISO 8601 string, UTC) - server-generated at submit
- `first_name` (string, required)
- `last_name` (string, required)
- `email` (string, required) - validated, stored lowercased
- `phone` (string, required) - E.164, for example `+447700900123`
- `due_month` (string, required) - `YYYY-MM`, past months rejected
- `parity` (integer, required) - 1 to 5, where 5 means "fifth or more"
- `consent` (boolean, required) - must be true to submit
- `consent_at` (ISO 8601 string) - when consent was given

> **Locked shapes.** `due_month` is `YYYY-MM`, never a full date. `parity` is an
> integer 1 to 5, never a label string. `phone` is always E.164. Features 3, 4,
> and 5 all depend on these.

**Sensitivity.** Due month plus parity is pregnancy information, which is health
data and special category data under UK GDPR Article 9. Consent is explicit,
timestamped, and never pre-ticked; the sheet stays access-restricted; fonts are
self-hosted so no visitor IP reaches a third-party CDN.

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
- **next/font/google** - self-hosts Bodoni Moda, EB Garamond, IM Fell English SC,
  IBM Plex Sans 600
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

**Design authority: `UI-design/Homepage.png` and `UI-design/design-token.png`.**
Where anything disagrees with the design, the design wins, except the three
approved deviations below.

### Approved deviations from the spec

| Deviation | Spec | Built | Why |
| --- | --- | --- | --- |
| Name | one combined field | first + last, side by side | confirmation echoes first name reliably |
| Due date | Monday-first day grid, stores a Date | year stepper + month grid, stores `YYYY-MM` | a due date is an estimate |
| Button face | `#93A7B8` (2.31:1, spec's own knowing AA failure) | `#4A6E92` (~4.6:1) | the spec supplies this value as its AA fix |

### Character

Embossed paper, one light source at upper left. Depth from shadow ladders, never
borders. Inputs are pressed wells cut into the card; the button is a flush inlay,
coplanar with the surface, distinguished only by material and a roughened seam.

### Key values

- Ground `#E2D7C6`, card `#E8DFD1`, well `#CBBEA8`, calendar `#F6F0E6`
- Ink `#3B3227`, soft `#6B5E4D`, heading `#4A3F31`, oxblood accent `#7A2E2E`
- Card max-width 620px, radius 5px, all padding in `clamp()`
- Form gap 22px, label gap 9px
- Texture never on a content surface: full-bleed `::before` at `z-index:0`, parent
  `isolation:isolate`, `mix-blend-mode:soft-light`
- Tile scale 512px page and card, 280px button and wells
- Motion only on the button, 120ms ease on transform and box-shadow
- Logo at 104px, `mix-blend-mode:multiply`, `opacity:0.88`
- **Light theme only.** No dark variant is specified; the scaffold's
  `prefers-color-scheme` override is removed.

### Routes

- `/` - the waitlist page. Form, then confirmation panel replacing it in place on
  success, echoing first name and email. No navigation on submit.
- `/privacy` - the privacy policy, same paper theme, linked from the consent
  checkbox.

### Accessibility

Real `<label>` on every field; placeholders never carry required information;
oxblood focus ring on all interactive elements; parity pills are an arrow-key
navigable radio group; month picker closes on Escape; errors announced, not
colour-only; `prefers-reduced-motion` disables the button transition.

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
- **Domain:** > TODO

Preview deployment per feature branch. Production deploy stays explicit;
`/release vercel` prepares config but never deploys on its own.

## Open questions

Gaps and mismatches carried from the plans. Resolve in the plans, then re-run
`/overview`.

- **The mockup contradicts the approved button colour.** `Homepage.png` shows
  `#93A7B8`; the approved build uses `#4A6E92`. This is intentional. Do not
  "correct" the code back to the screenshot.
- **Two texture assets were never delivered.** `paper-tile.webp` and
  `felt-tile.webp` are referenced by the spec but absent. Feature 1 generates
  substitutes with `feTurbulence`, so the surface will be close but not identical
  to the original render.
- **Signup records have no stable identifier.** Row position is the only identity,
  which makes a GDPR deletion request manual and error-prone. Decide whether to
  add an id before the list grows.
- **Logo filename contains a space** (`UI-design/TSB FAVACON.png`). Copy it into
  the app under a space-free name.
- **Privacy policy wording** needs a human author, not generated text.
- **Retention period** for signup data is undecided.
- **"Your area"** is promised in the headline copy but has no operational meaning
  defined yet.
- **Duplicate emails**: reject, merge, or allow is undecided.
- **Migration trigger** for moving off Google Sheets is undefined.
