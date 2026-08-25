# Project Plan

## 1. Problem - What problem are we solving?

The Postpartum Suite opens postpartum care places area by area and cannot serve
everyone at once. Today there is no way for an expectant mother to register
interest, and no way for the business to see where demand is concentrated before
committing to an area.

The waitlist closes both gaps. It captures interest while intent is high, and it
collects the small amount of structured data (due month, parity, phone area)
needed to decide where to open next and who to contact first.

This is not the product. It does not book, schedule, take payment, or create
accounts. It is one page whose only job is to convert interest into a contact
record without losing the calm the brand depends on.

## 2. Users - Who is this for?

**Primary: expectant and new mothers in the UK.** Usually second or third
trimester, or recently given birth.

Context that directly shaped design decisions:

- Usually on a phone, one-handed, often tired. Single column throughout, generous
  tap targets, no multi-step flow.
- Low friction tolerance. Seven fields is the ceiling, not a starting point.
- Emotionally invested. The page must feel considered and human, which is why the
  paper aesthetic is treated as a requirement and not decoration.
- **Often do not know an exact due date.** This is the reason the picker collects
  month and year only, and the reason we deviated from the day grid in the spec.

**Secondary: the Postpartum Suite team**, who read the collected list to decide
where to open and whom to contact as places free up.

## 3. Features - What does the MVP need?

- One page reproducing the approved design exactly
- Waitlist form: first name, last name, email, UK-default phone, due month and
  year, birth parity, consent
- Month and year due date picker in the design's popover shell
- Client and server validation with inline, non-alarming error messages
- Confirmation panel that replaces the form on success, echoing first name
- Each signup appended to a Google Sheet
- A `/privacy` page for the policy the consent checkbox references

**Explicitly out of scope for the MVP:** accounts, login, booking, payments,
admin dashboard, transactional or marketing email, analytics, bot protection,
duplicate detection, internationalisation, dark mode.

## 4. Data - What are we storing?

One record per signup. There are no accounts and no user-owned queries, so there
is no per-user authorisation model to design.

| Field | Type | Notes |
| --- | --- | --- |
| `first_name` | string | required |
| `last_name` | string | required |
| `email` | string | required, validated, lowercased |
| `phone` | string | required, stored E.164, for example `+447700900123` |
| `due_month` | string | required, `YYYY-MM`, past months rejected |
| `parity` | integer | required, 1 to 3, where 3 means "third or more" |
| `consent` | boolean + timestamp | required, must be true to submit |
| `created_at` | timestamp | server-generated, UTC |

**Storage: a Google Sheet, explicitly temporary.** Rows are appended through the
Sheets API using a service account. This is a deliberate trade: it gets a working
waitlist live quickly and lets the team read signups with no tooling.

All persistence sits behind a single typed function, `saveSignup(input)`, in one
module. Swapping the sheet for a database later must not touch the form, the
validation, or the confirmation flow.

**Sensitivity.** A due month combined with birth parity is pregnancy information,
which is health data and therefore special category data under UK GDPR Article 9.
Consequences carried into the build:

- Consent is required, explicit, and timestamped, never pre-ticked
- The sheet stays restricted to team members who need it
- A retention period must be decided before launch (TODO)
- Deletion requests are handled by hand while on Sheets, which is workable only
  at small scale and is the main reason to migrate
- Fonts are self-hosted rather than fetched from Google's CDN, avoiding a
  third-party request tied to a visitor's IP

## 5. Tech - What stack are we using?

Already scaffolded: Next.js 16 (App Router), React 19, TypeScript strict,
Tailwind CSS v4, ESLint 9, npm.

Additions this project needs:

- **Server Action** for submit. No API route is required; there is no webhook, no
  upload, and no external client.
- **Zod** for one schema shared by client and server validation
- **google-auth-library** plus a direct Sheets REST append. Lighter than pulling
  in all of `googleapis` for a single call.
- **next/font/google** self-hosting Bodoni Moda, EB Garamond, IM Fell English SC,
  and IBM Plex Sans 600 at the exact axes the spec pins

Deliberately not used: no ORM, no database, no auth, no component library, no
state management, no animation library. The design needs one 120ms CSS
transition, and nothing here justifies more.

Textures are generated with an SVG `feTurbulence` filter and baked to tiling
WebP, because the original `paper-tile.webp` and `felt-tile.webp` were never
delivered with the design.

Testing: no runner is configured, so the Blueprint test gate is off. Validation
and the phone and date helpers are the logic worth covering if that changes.

## 6. Monetize - How will this make money?

The waitlist earns no revenue directly, and should not try to.

Its business value is de-risking. It produces a warm list segmented by area and
due month, so the first locations open with demand already evidenced rather than
assumed, and the team knows who to call the day a place frees up. Revenue comes
later from the Postpartum Suite service itself, which is outside this project.

## 7. UI/UX - How should this look and feel?

**Design authority: `UI-design/Homepage.png` and `UI-design/design-token.png`.**
These are the source of truth. Where this plan and the design disagree, the
design wins, except for the three deviations approved below.

### Approved deviations

| Deviation | Spec says | We build | Why |
| --- | --- | --- | --- |
| Name | one combined `NAME` field | First name + last name, side by side, stacking narrow | Confirmation echoes first name; splitting makes that reliable |
| Due date | Monday-first day grid, stores a Date | Year stepper + 3x4 month grid, stores `YYYY-MM` | A due date is an estimate; asking for a day implies false precision |
| Button face | `#93A7B8`, 2.31:1, spec calls it a knowing WCAG AA failure | `#4A6E92`, ~4.6:1 | The spec supplies this value itself as the AA fix, so it stays inside the design system |

Everything else is followed exactly: the elevation ladder, shadow stacks,
`clamp()` padding, type scale, hairline rule, pill and well treatments, and the
flush-inlay button with its roughened `#kerf` seam.

### Character

Embossed paper stock with a single light source at upper left. Depth comes from
shadow ladders, never from borders. Inputs are pressed wells cut into the card;
the button is a flush inlay, coplanar with the surface, distinguished only by
material and a roughened seam. Restrained, tactile, unhurried.

### Key values

- Ground `#E2D7C6`, card `#E8DFD1`, well `#CBBEA8`, calendar `#F6F0E6`
- The built card sits on the ground colour with the paper tile, not on
  `#E8DFD1` with felt: with the real scans in place, the two-colour split read
  as a panel pasted onto the page rather than one embossed sheet
- Ink `#3B3227`, soft ink `#6B5E4D`, heading `#4A3F31`, oxblood accent `#7A2E2E`
- Card max-width 620px, radius 5px, all padding in `clamp()`
- Form gap 22px, label gap 9px
- Texture never on a content surface: full-bleed `::before` at `z-index:0`,
  `isolation:isolate` on the parent, `mix-blend-mode:soft-light`
- Tile scale 512px for page and card, 280px for button and wells
- Motion is limited to the button, 120ms ease on transform and box-shadow
- Logo mark: `UI-design/TSB FAVACON.png` (800x800 RGBA, cream disc `#FBF7F2`),
  rendered at 104px with `mix-blend-mode:multiply` and `opacity:0.88`, so the
  paper texture reads through the disc. Also the source for the site icon. Copy
  it into the app under a space-free filename rather than referencing it from
  `UI-design/`.

### Accessibility

- Every field has a real `<label>`, not a placeholder standing in for one
- Placeholders are italic `#8A7D6C` and never carry required information
- Oxblood focus ring on every interactive element, per the spec's `:focus` rule
- Parity pills are a radio group, arrow-key navigable
- The month picker is keyboard operable and closes on Escape
- Errors are announced, not colour-only
- `prefers-reduced-motion` disables the button transition
- Light theme only. The palette is a fixed paper design with no dark variant
  specified, so the scaffold's `prefers-color-scheme` override is removed.

## 8. Deployment - Where and how will this ship?

- **Host:** Vercel
- **Region:** London (`lhr1`) for functions, keeping signup data in the UK
- **App type:** Next.js 16 App Router, server-rendered with one Server Action
- **Build:** `npm run build`
- **Start:** handled by Vercel
- **Env vars:** `GOOGLE_SHEETS_SPREADSHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`,
  `GOOGLE_PRIVATE_KEY`
- **Database:** none
- **Workers or cron:** none
- **Health check:** the root route
- **Domain:** TODO

Preview deployments per feature branch. Production deploy stays a separate,
explicit step; `/release vercel` prepares config but never deploys on its own.

## 9. Assumptions, TODOs, and open decisions

**Assumptions in force** (correct any and the plan follows):

1. Phone stored E.164; dial-code select offers a short common-country list, UK
   first and default
2. Parity stored 1 to 3, where 3 means "third or more". Revised down from 1 to
   5 during the design revision: five pills would not sit on one row on a phone,
   and the segment past a third baby is too small to plan an opening around.
3. Submit swaps the card contents in place, with no page navigation
4. The supplied logo serves as both the in-page mark and the site icon. At 16px
   the script strokes will soften; a simplified small-size variant is a later
   polish item, not an MVP concern.

**Open TODOs:**

- Privacy policy wording, which needs a human author, not generated text
- Retention period for signup data
- What "your area" means operationally, since the headline copy promises it
- Whether duplicate emails should be rejected, merged, or allowed
- Domain name
- Migration target and trigger point for moving off Google Sheets
