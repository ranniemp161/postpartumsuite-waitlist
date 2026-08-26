# Fix: Flat redesign, plus outward postcode field

**Type:** Fix
**Status:** built, all six steps verified; build and lint clean, parser proven
against 23 cases. Shipped with three client decisions still open (see below).

## Open at merge

- Field border `#C1C1C1` is 1.9:1 on white, below the 3:1 WCAG 1.4.11 asks of a
  control boundary. Kept knowingly because the design wins; `--color-line:
  #949494` reverses it in one line.
- The mockup crops at the button, so the parity pills, consent row, and
  confirmation panel are built in the design's language rather than matched.
- The area field's label reads "Your area" with a hint line, not the client's
  literal "Your Location (first part of your poste code)".
- `normalisePostcodeOutward()` has no test: the project has no runner, so the
  logic was proven by execution instead. Run `/tests` to close this.

## Manual step required

Add a `postcode_outward` header cell to **column J** of the Signups tab before
the next submit. The value lands there either way; the column is unlabelled
until someone names it.

Client-directed change to shipped work, not a build-plan item. Features 1, 2, 3,
6, and 7 are all affected, but no build-plan item is added or reopened.

## The problem

Two client changes arrived together after feature 7 shipped.

**1. The visual language is replaced.** The client rejected the embossed-paper
direction and supplied a new mockup: white ground, no card, no texture, hairline
grey field borders, a solid navy button, and letterspaced sans-serif caps labels.
The material system built in feature 1 (texture tiles, the `#kerf` filter, shadow
ladders, pressed wells, the three-layer masked logo deboss) has no role in the new
design and most of `app/globals.css` becomes dead weight.

**2. A location field is missing.** The client wants to capture the first part of
the visitor's UK postcode, deliberately not the full one. That first part is the
**outward code**: the `SW7` of `SW7 2AZ`. A full UK postcode narrows to roughly
fifteen addresses, effectively a household; an outward code covers a district of
roughly eight thousand. Taking only the outward code is proportionate to the
stated purpose (deciding which areas to open in) and is textbook data
minimisation under UK GDPR Article 5(1)(c).

This also gives operational meaning to the "your area" phrase in the headline
copy, which `project-overview.md` currently lists as an open question.

## The fix

### What does not change

The data contract is intact. `due_month` stays `YYYY-MM`, `parity` stays the
integer 1 to 3, `phone` stays E.164, `consent` stays an explicit un-pre-ticked
checkbox writing `consent_at`. The Server Action, `saveSignup()`, the Zod schema
structure, the error wiring, and the aria relationships are all preserved. Two
of these are deliberate departures from the new mockup:

| Mockup shows | We build | Why |
| --- | --- | --- |
| `DD / MM / YYYY` | `MM / YYYY`, month picker restyled | A due date is an estimate; the schema is locked on `YYYY-MM` |
| No parity pills, no consent row | Both kept, restyled | Parity is the demand signal; consent is an Article 9 requirement, not a style choice |

The picker keeps its year stepper and 3x4 month grid, its Escape handling, and
its keyboard model. Only its skin changes.

### Postcode shape

The outward code comes in six shapes, all of which must be accepted:

| Shape | Examples |
| --- | --- |
| letter + digit | `M1`, `E4` |
| letter + 2 digits | `M60`, `E17` |
| letter + digit + letter | `W1A`, `E1W` |
| 2 letters + digit | `CR2`, `SW7` |
| 2 letters + 2 digits | `DN55`, `SW19` |
| 2 letters + digit + letter | `EC1A`, `EC1V` |

One pattern covers all six: `^[A-Z]{1,2}\d[A-Z\d]?$`

Do not validate harder than this. Checking area letters against the real list
would reject genuine signups for no gain, and `E1W` and `EC1A` are both live East
London districts inside the client's target area.

Two input behaviours are required, not optional polish:

- **A full postcode is accepted and trimmed to its outward half.** Many visitors
  will type `SW7 2AZ` regardless of the label. Matching
  `^([A-Z]{1,2}\d[A-Z\d]?)\d[A-Z]{2}$` and keeping only group 1 is both friendlier
  and more private: the sensitive half is discarded before anything is written.
- **Normalisation before matching.** Uppercase, strip all whitespace, and retry
  once with `O` to `0` and `I` to `1` applied after the leading letter run. That
  is the one real-world typo worth handling.

The field is required. Location is the most decision-relevant value in the form.

### Sheet column, and the sharp edge

`SheetRow` in `lib/sheets.ts` is positional and its own comment warns about
reordering. The new value must be **appended as the tenth cell, after
`consent_at`**, not inserted next to `due_month` where it belongs logically.
Rows already written are fixed text in the sheet; inserting mid-row would leave
new signups' postcodes sitting under a column header that older rows use for
something else.

**Manual prerequisite:** add a `postcode_outward` header cell to column J of the
Signups tab before the first submit after this ships.

### Must not break

- The positional sheet contract for the nine existing columns
- Consent staying explicit, un-pre-ticked, and timestamped
- Keyboard operation and aria wiring on the picker, the parity radio group, and
  every field error
- `prefers-reduced-motion` still disabling button motion
- The Server Action failure path that logs a row rather than silently losing a
  signup

## Prerequisites

- [x] Save the new mockup to `UI-design/Homepage-v2.jpeg`. Done: it arrived as a
      WhatsApp export and was renamed. Every colour and measurement in this spec
      was then sampled from it rather than estimated.
- [x] Confirm the logo asset. `public/logo-mask.png` turned out to be the mark
      itself, black on transparent, so it was renamed `public/logo.png` and is
      rendered flat. No new asset needed.
- [ ] Full-height mockup if one exists, so the confirmation panel, the consent
      row, and anything below the button are matched rather than inferred.

## Build steps

Colour values below were sampled from `Homepage-v2.jpeg`, not estimated.

- [x] **1. Flat foundation and page chrome.** Replace the `@theme`, `:root`, and
      `@layer base` blocks of `app/globals.css`: white ground, ink near `#111111`,
      hairline `#C1C1C1`, navy `#194575`, muted `#858585`, rule `#D8D8D8`,
      all sampled from the mockup rather than estimated. Drop the texture tile
      vars, the emboss text-shadow ladder, and the chevron recolour. Remove the
      `#kerf` `<svg>` defs from `app/layout.tsx`. Rework `app/page.tsx`: logo as a
      plain `<img>`, wordmark, italic tagline, hairline rule, intro copy, no card
      wrapper. Restyle `.field-label` to letterspaced uppercase Bodoni bold. Zooming
      the mockup showed bracketed serifs, not the sans this spec first assumed,
      so IM Fell is dropped and IBM Plex falls to weight 400 for the button
      label, the only sans left on the page.
      **Done when:** the header block from logo down to the hairline rule matches
      the mockup on desktop and at 375px. The form controls below will still look
      wrong at this point; that is expected and step 2 fixes it.

- [x] **2. Form controls.** Flat restyle of the wells, the dial-code select, the
      parity pills, the consent row, and the button. Inputs become white with a
      1px hairline border and the oxblood focus ring replaced by a navy one. The
      button becomes a solid full-width navy block with letterspaced caps. Delete
      `.card-raised`, the pressed-well shadow ladder, `.btn-inlay`, and the
      `.logo-deboss` rules.
      **Done when:** every control matches the mockup, focus is visible on all of
      them via keyboard, and the parity group still moves under arrow keys.

- [x] **3. Month picker skin.** Restyle the popover and its trigger: white sheet,
      hairline border, flat shadow, navy selected state. Trigger placeholder
      becomes `MM / YYYY` with the calendar glyph on the right.
      **Done when:** the picker opens, closes on Escape, disables past months,
      returns `YYYY-MM` unchanged, and reads as part of the new design.

- [x] **4. Outward postcode field.** Add `normalisePostcodeOutward()` to a new
      `lib/postcode.ts` handling the six shapes, the full-postcode trim, and the
      `O`/`I` retry. Add `postcode_outward` to `WAITLIST_FIELDS` and the Zod
      schema, append the tenth cell in `lib/sheets.ts`, and render the field in
      `WaitlistForm.tsx` with `autocomplete="postal-code"` and auto-uppercase.
      Label "Your area", helper text "First part of your postcode, for example
      SW7".
      **Done when:** `SW7 2AZ`, `sw7`, `EC1A`, `E1W`, `M60`, and `DN55` all submit
      and land in column J as the outward code alone; `ZZZZ` and an empty value
      show an inline error.

- [x] **5. Remaining surfaces and cleanup.** Restyle `ConfirmationPanel`,
      `/privacy`, and `SiteFooter`. Add the privacy policy line covering the
      partial postcode and why the full one is deliberately not collected. Delete
      `public/textures/*.webp` and any CSS, font, or asset left unreferenced.
      **Done when:** all three surfaces match the new design, `/privacy` states
      the postcode position, and no dead asset or rule remains.

- [x] **6. Docs.** Rewrite the UI/UX section of `project-overview.md` for the flat
      system, replace the approved-deviations table with the two above, add
      `postcode_outward` to the data model as column ten, and close the "your
      area" and button-contrast open questions. The navy button clears AA, so the
      knowingly-accepted contrast failure no longer exists.
      **Done when:** the overview describes the app as built, with no stale
      reference to texture, emboss, or `#93A7B8`.

## Verify

No test runner is configured, so the test gate is off and steps verify with the
build plus the running app.

- `npm run build` clean, and `npm run lint` clean
- Side-by-side against `Homepage-v2.jpeg` at desktop width and at 375px
- Keyboard-only pass: tab through every control, confirm a visible focus ring,
  operate the parity group with arrow keys, open and Escape the month picker
- Submit a real signup and confirm the Sheets row: nine existing columns unchanged
  in position, outward code alone in column J
- Submit `SW7 2AZ` and confirm only `SW7` is stored
- Reduced-motion on, confirm the button no longer transitions

Step 4 adds parser logic of exactly the kind `coding-standards.md` names as worth
covering. Consider `/tests` before or after this fix to turn the gate on and cover
`normalisePostcodeOutward()`.
