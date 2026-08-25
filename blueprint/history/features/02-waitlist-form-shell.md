# Feature: Waitlist form shell

**From build-plan:** feature 2
**Status:** built, all six steps verified against Homepage.png; ready for /complete

## Goal

Build the complete static form inside the card that feature 1 left empty: every
label, pressed well, the phone row, the due-date trigger, the parity pills, the
consent row, and the flush-inlay button. Nothing submits and nothing validates.

The design is the requirement this project is judged against, so the surface
lands before the behaviour. Features 3, 4, and 5 attach a picker, validation, and
persistence to markup that is already correct rather than reshaping it.

## Design reference

**Authority: the two images in `UI-design/`**, per the overview and
`coding-standards.md`. They are linked rather than copied into
`blueprint/reference/` because they total 13MB and feature 1 already set this
precedent.

- [UI-design/design-token.png](UI-design/design-token.png) - the CSS
  specification. **Sections 05, 07, and the pill block of 06 are in scope.**
  Sections 01-04 and 08 were feature 1; the calendar popover in 06 is feature 3.
- [UI-design/Homepage.png](UI-design/Homepage.png) - the rendered page. This
  feature builds everything below the hairline rule.

The image is 1920px wide at DPR 1.25, so **divide any pixel you measure off
`Homepage.png` by 1.25** to get CSS pixels. The card measures 772px in the image
and is 620px in CSS.

Exact values from the sections in scope are transcribed in **Appendix A**, so
implementation reads text rather than re-reading a screenshot. Where the appendix
and the image disagree, the image wins.

## In scope

- `components/waitlist/WaitlistForm.tsx` - the whole form as one server component
- The pressed-well material recipe from spec section 05, and the field label,
  form rhythm, and label rhythm rules from section 03
- First name and last name side by side, email, the two-column phone row, the
  static due-date trigger with its calendar icon
- Parity as a real `<fieldset>` radio group, styled through `:checked` so the
  selected state works with no JavaScript
- The consent row: checkbox, italic copy, and the `/privacy` link
- The flush-inlay button from spec section 07: felt grain, kerf seam, Plex label,
  and the 120ms `:active` press
- `lib/waitlist-options.ts` - the parity and dial-code option lists that features
  4 and 5 will import

## Out of scope

- **The calendar popover** (feature 3). This feature builds the trigger and its
  icon only; the trigger opens nothing.
- **Validation, `required`, submit, the confirmation panel** (feature 4). No Zod,
  no server action, no error slots.
- **Google Sheets** (feature 5).
- **The `/privacy` page** (feature 6). The consent link points at `/privacy`,
  which 404s until then. That is expected, not a bug.
- **Responsive stacking, focus rings beyond the spec's own `:focus` rule,
  aria-live errors, `prefers-reduced-motion`** (feature 7). The one exception is
  the spec's `:focus` well shadow, which is part of section 05 and ships here.
- Any `'use client'`. Nothing in this feature is interactive beyond what native
  radios, checkboxes, and CSS give for free.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - The well recipe, plus name and email.** Create
  `components/waitlist/WaitlistForm.tsx` and render it from `app/page.tsx` below
  the hairline. Add the `.form-stack`, `.field`, `.field-label`, and `.well`
  component classes to `globals.css` from Appendix A. Build the first name / last
  name row as a two-column grid and the email field below it.
  *Done when:* three labelled inputs render; each well reads as **cut into** the
  card - dark inner shadow at the top, a lit lip on the paper directly below it,
  and no `border` property anywhere in the rule; the felt grain is visible inside
  the well but the typed text is unaffected by it; clicking into a field shows
  the oxblood ring from the spec's `:focus` rule; `npm run build` passes.

- [x] **Step 2 - The phone row.** Add the dial-code `<select>` and the national
  number `<input type="tel">` in the spec's
  `grid-template-columns:minmax(112px,auto) 1fr` row, with `DIAL_CODES` in
  `lib/waitlist-options.ts` defaulting to UK +44.
  *Done when:* the two controls sit on one line with the select sized to its
  content, both are the same height and share one continuous well treatment, the
  select shows no native chevron (spec sets `appearance:none`), and the row
  matches the `PHONE NUMBER` row in `Homepage.png` side by side.

- [x] **Step 3 - The due-date trigger.** A `<button type="button">` styled by the
  same `.well` rule, with the placeholder text `Select your due date` on the left
  and an inline calendar glyph on the right, labelled by a real `<label for>`.
  *Done when:* the trigger is the same height as an input and indistinguishable
  from one except for the icon; the placeholder text uses the italic placeholder
  colour, not ink; the icon sits on the right edge inside the padding; clicking
  it does nothing and **does not submit or reload the page**.

- [x] **Step 4 - Parity pills.** A `<fieldset>` with the label as its `<legend>`,
  five visually hidden radios each with a `.pill` label, driven by `:checked`.
  Options come from `PARITY_OPTIONS` in `lib/waitlist-options.ts`.
  *Done when:* five pills render in a row reading First / Second / Third /
  Fourth / Fifth or more; clicking one selects it and deselects the rest with no
  JavaScript; **arrow keys move between them and Tab enters and leaves the group
  as one stop** (this comes free from native radios; if it does not work, the
  markup is wrong); the unselected pill reads as a shallow well and the selected
  one as a filled tab; the fieldset shows no default browser border.

- [x] **Step 5 - The consent row.** A 19px checkbox with `accent-color`, the
  italic consent copy, and the `privacy policy` link.
  *Done when:* the checkbox is not styled as a well; checking it shows oxblood,
  not the browser default blue; clicking the copy toggles the checkbox but
  **clicking the `privacy policy` link navigates without toggling it** (see the
  trap in Notes); the link is visibly a link in the paper theme.

- [x] **Step 6 - The flush-inlay button.** The full section 07 recipe: felt
  `::before` at 280px / soft-light / 0.55, the `::after` kerf seam, the Plex 600
  label span, and the `:active` half-pixel press.
  *Done when:* the button reads as **coplanar with the card** - there is no drop
  shadow and no raised bevel, only the colour change and the seam; the seam is
  visibly irregular under magnification rather than a clean vector line, proving
  `#kerf` is doing work; pressing and holding shifts it half a pixel over 120ms;
  the face is `#4A6E92`, **not** the `#93A7B8` in `Homepage.png`; a full-page
  screenshot at 1536px CSS width matches `Homepage.png` allowing for the three
  approved deviations.

## Files / areas

| Path | Change |
| --- | --- |
| `components/waitlist/WaitlistForm.tsx` | new - the entire form, server component |
| `lib/waitlist-options.ts` | new - `PARITY_OPTIONS`, `DIAL_CODES` |
| `app/page.tsx` | renders `<WaitlistForm />` below the hairline |
| `app/globals.css` | new component classes in the existing `@layer components` |

`components/` and `lib/` do not exist yet; `coding-standards.md` already reserves
both paths, so create them here rather than inventing a new layout.

## Data / contracts

No persistence and no types yet, but the **field names and the parity encoding
are load-bearing** - features 4 and 5 build the Zod schema and the sheet columns
directly on them, and the sheet's column order is its schema. Fix them now.

| `name` attribute | Control | Feeds |
| --- | --- | --- |
| `first_name` | text input | `first_name` column |
| `last_name` | text input | `last_name` column |
| `email` | email input | `email` column, lowercased at submit |
| `dial_code` | select, default `+44` | joined with `phone_national` into the E.164 `phone` column |
| `phone_national` | tel input | as above |
| `due_month` | feature 3's hidden input, **not built here** | `due_month` column, `YYYY-MM` |
| `parity` | radio group, values `1` to `5` | `parity` column, integer 1-5 |
| `consent` | checkbox | `consent` and `consent_at` columns |

```ts
// lib/waitlist-options.ts
export const PARITY_OPTIONS = [
  { value: 1, label: "First" },
  { value: 2, label: "Second" },
  { value: 3, label: "Third" },
  { value: 4, label: "Fourth" },
  { value: 5, label: "Fifth or more" },
] as const;

export const DIAL_CODES = [
  { code: "+44", label: "UK +44" },
  { code: "+353", label: "IE +353" },
] as const;
```

**`parity` is the integer, never the label.** The overview locks it as an integer
1 to 5 where 5 means "fifth or more". The label is display only and must never
reach the sheet.

**Open choice at review:** the spec calls for a dial-code select but the mockup
shows only `UK +44`, and the overview describes a UK audience. The list above is
the smallest thing that justifies being a `<select>` at all. It is a one-line
array to extend, so say now if it should be UK-only or longer.

New CSS classes, added to the existing `@layer components` block. Feature 1
established the convention that raw scale values live in `@theme` as utilities
and multi-declaration material recipes live here; these are all recipes.

`.form-stack` `.field` `.field-label` `.well` `.phone-row` `.parity-set`
`.pill` `.consent-row` `.btn-inlay`

## Testing

**No test runner is configured, so the Blueprint test gate is off** (see the
Testing section of `coding-standards.md`). This feature is presentation plus two
constant arrays; there is no parser, validator, or formatter in it, so it would
be exempt regardless. Feature 4 brings the first logic worth covering.

`npm run build` is the automated gate at every step. There is no `Verify` command
and no `typecheck` script; `npm run build` type-checks as part of the build.

Evidence per step is the done-when above. The four that need more than a glance:

- **Step 1, the well:** a screenshot of one focused and one unfocused field. The
  claim is that the well reads as pressed **and** that the felt grain does not
  touch the typed text, and only a picture settles that.
- **Step 4, the radio group:** keyboard evidence, not a screenshot. Tab into the
  group, press the right arrow, confirm selection moves and Tab exits to the next
  control rather than to the next pill.
- **Step 6, the seam:** a magnified crop of the button edge. A clean straight line
  means `#kerf` is not being applied and the step is not done.
- **Step 6, fidelity:** a full-page screenshot at 1536px CSS width beside
  `Homepage.png`. Prose cannot settle whether a shadow ladder is right.

## Notes for the AI

**Traps, in the order they will bite.**

- **The spec's bare selectors will hit the wrong elements.** Section 05 writes
  `input, select, .date-trigger{...}` and section 03 writes
  `label{display:flex;flex-direction:column;gap:9px}`. Applied literally, the
  well treatment lands on the consent checkbox and the column rhythm lands on the
  pill and consent labels. **Scope every one of these to a class** (`.well`,
  `.field`), never to the bare element.
- **A bare `<button>` inside a `<form>` submits.** Both the due-date trigger and
  the main button need `type="button"` in this feature. The form has no action
  yet, so a submit would navigate with the visitor's name, email, and phone in
  the query string. Feature 4 flips the main button to `type="submit"` when the
  server action exists. Leave a one-line comment saying so.
- **A link inside a `<label>` toggles the control it labels.** Do not wrap the
  consent copy and the `privacy policy` link in one `<label>`. Use
  `<input id="consent">`, a `<label for="consent">` holding only the plain text,
  and put the `<a>` outside the label. Anything else needs `'use client'` to stop
  the propagation, and this feature has no client components.
- **`<fieldset>` and `<legend>` carry heavy browser defaults.** Reset `border`,
  `margin`, `padding`, and `min-inline-size` on the fieldset, and `padding` on
  the legend, or the group will not match the other fields.
- **Server components throughout.** No `'use client'` should appear anywhere in
  this feature. Native radios give arrow-key roving and the `:checked` selector
  gives the selected state, so if a step seems to need state, the step is wrong.
- **Depth is never a border.** Every edge in this design is a shadow. If a
  `border` or `outline` shorthand appears on a well, pill, or the button, it is
  wrong. `outline:none` on the well is correct because the spec replaces the
  outline with its own `:focus` shadow.
- **The well texture is `background-blend-mode` on the input itself**, not a
  pseudo-element. Inputs cannot host `::before`, which is exactly why section 02
  makes the well the one exception to the pseudo-element rule.
- **`--color-btn-face` is `#4A6E92`.** `Homepage.png` shows `#93A7B8`. This is an
  approved deviation carried in the overview; do not "correct" the code back to
  the screenshot.
- **`isolation:isolate` on the button is load-bearing.** Without it the
  `::before` soft-light blends against the card instead of the button face and
  the felt grain disappears.
- **Contrast debt, flag it and move on.** The selected pill is white on `#8AA6C2`,
  about 2.5:1, the same knowing AA failure that section 09 fixed for the button
  by darkening it to `#4A6E92`. Section 09 does not mention the pills, so **build
  the spec value** and let feature 7's accessibility pass decide. Do not silently
  darken it here.
- **The select has no chevron.** `appearance:none` with nothing drawn in its
  place is what the spec and the mockup both show. It is deliberate, not an
  omission. Note it for feature 7 rather than adding an arrow.
- **The name row is a fixed two-column grid here.** Narrow-screen stacking is
  feature 7. Do not add breakpoints in this feature.
- No em dashes in any generated content, per `coding-standards.md`.

---

## Appendix A - transcribed spec values

From `UI-design/design-token.png`, sections in scope. Verbatim, including the
values this project deliberately overrides.

### 05 - Pressed input well

```css
input, select, .date-trigger{
  box-sizing:border-box; width:100%;
  border:0; border-radius:3px;
  padding:15px 16px;                          /* select: 15px 12px */
  font-family:'EB Garamond',Georgia,serif; font-size:17.5px;
  color:var(--ink);
  background-color:var(--well);
  background-image:var(--tile-felt);
  background-size:280px 280px;
  background-blend-mode:soft-light;
  outline:none;
  box-shadow:
    inset 0 2px 4px rgba(74,56,40,0.30),      /* near wall of the well */
    inset 0 -1px 0 rgba(255,255,255,0.42),    /* bounced light, far wall */
    0 1px 0 rgba(255,255,255,0.85);           /* lit lip below the cut */
}
:focus{
  box-shadow:
    inset 0 2px 5px rgba(74,56,40,0.36),
    0 0 0 2px rgba(122,46,46,0.35);           /* oxblood focus ring */
}
select{ appearance:none; cursor:pointer; }    /* dial code, default +44 */
phone row{ display:grid; grid-template-columns:minmax(112px,auto) 1fr; gap:10px; }
checkbox{ width:19px; height:19px; accent-color:#7A2E2E; }
```

### 06 - Parity pills (the rest of section 06 is feature 3)

```css
/* parity pills - First / Second / Third / Fourth / Fifth or more */
pill{ border:0; border-radius:2px; padding:11px 16px; font-size:16px;
      background:var(--well);
      box-shadow:inset 0 2px 4px rgba(74,56,40,0.28), 0 1px 0 rgba(255,255,255,0.85); }
pill[selected]{ background:#8AA6C2; color:#FFFFFF;
      box-shadow:inset 0 1px 0 rgba(255,255,255,0.42),
                 0 6px 14px -8px rgba(46,68,92,0.6); }
```

### 07 - RCW2F button (flush inlay)

> A flush inlay, not a raised key: the blue is coplanar with the card, so there
> is no directional shading at all. The only cues are the material change and one
> uniform seam, roughened by an SVG turbulence filter so the cut is not a perfect
> vector line.

```css
button{
  position:relative; isolation:isolate;
  width:100%; border:0; border-radius:1px;
  padding:22px 40px;                    /* gallery footprint 18px 40px */
  background-color:var(--btn-face);     /* #93A7B8 */
  cursor:pointer;
  transition:transform 120ms ease, box-shadow 120ms ease;
}
button:active{ transform:translateY(0.5px); }

/* felt grain, under the label */
button::before{
  content:""; position:absolute; inset:0; z-index:0; border-radius:1px;
  background-image:var(--tile-felt); background-size:280px 280px;
  mix-blend-mode:soft-light; opacity:0.55; pointer-events:none;
}
/* the seam: same colour on all four sides, no light/dark wall */
button::after{
  content:""; position:absolute; inset:0; z-index:2; border-radius:1px;
  box-shadow:0 0 0 0.75px rgba(30,46,62,0.36);
  filter:url(#kerf); pointer-events:none;
}
/* label */
span{
  position:relative; z-index:1;
  font-family:'IBM Plex Sans',system-ui,sans-serif;
  font-weight:600; font-size:17px;
  letter-spacing:0.05em; text-transform:uppercase;
  color:#F3F7FB;
  text-shadow:-1px -1px 0.5px rgba(8,20,34,0.20);   /* soft press, upper left only */
}
```

The `--btn-face` comment above is the spec's own `#93A7B8`. It is built as
`#4A6E92`, per the approved deviation and section 09's own fix.

### 09 - Behaviour notes (fields and contrast)

```text
Fields      name (required) - email (required) - dial code select, default +44
            - phone tel (required) - due date (calendar, past dates disabled)
            - parity: First / Second / Third / Fourth / Fifth or more
            - consent checkbox (required)
Responsive  single column throughout; card max-width 620px, all padding in clamp()
Motion      only the button, 120ms ease on transform + box-shadow
Contrast    #F3F7FB on #93A7B8 = 2.31:1. This FAILS WCAG AA (4.5:1 normal,
            3:1 large) and 17px/600 does not qualify as large text (needs
            >=18.66px bold). It is a knowing exception, carried over from the
            approved RCW2F face - do not treat it as compliant.
            If AA is required: keep the label at #F3F7FB and darken the face
            to #4A6E92 (the sheet's own deep blue, ~4.6:1).
```

The "(required)" markers above are feature 4's job. This feature ships the
controls without `required`, so the browser does not start validating a form
that cannot submit yet.

### Copy, transcribed from `Homepage.png`

| Element | Text |
| --- | --- |
| Label | `NAME`, built as `FIRST NAME` / `LAST NAME` (approved deviation) |
| Placeholders | `Your first name`, `Your last name` |
| Label | `EMAIL`, placeholder `you@example.com` |
| Label | `PHONE NUMBER`, select `UK +44`, placeholder `7700 900123` |
| Label | `BIRTH DUE DATE`, trigger text `Select your due date` |
| Legend | `IS THIS YOUR FIRST BABY?` |
| Pills | `First` `Second` `Third` `Fourth` `Fifth or more` |
| Consent | `I agree to receive updates and accept the privacy policy.` |
| Button | `JOIN OUR WAIT LIST` |
