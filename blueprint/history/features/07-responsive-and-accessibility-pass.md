# Feature 7 - Responsive and accessibility pass

**Type:** Feature
**From build-plan:** feature 7
**Status:** complete (2026-08-26)

## Goal

Make the finished waitlist usable on a narrow phone and by a keyboard or screen
reader, without loosening the embossed-paper look. Everything on the page works
today for a sighted mouse user on a laptop; this pass closes the gaps the earlier
features deliberately deferred, several of which are already marked "feature 7
decides" in `app/globals.css`.

## Design reference

- `UI-design/Homepage.png` - the visual authority. No change in this feature may
  make the page read differently at desktop width.
- `UI-design/design-system-spec.md` - sections 05 (well focus), 06 (calendar),
  09 (the button's own AA fix).

The look is already built. This feature adds states the mockup does not show
(focus, reduced motion, 320px) and repays the contrast debts the spec itself
flagged. Treat any pixel change at desktop width as a regression unless it is one
of the two decisions below.

## Decisions settled at the Step 1 review gate

Both were recorded in the CSS as feature 7's call.

- **D1: keep the mockup face.** `#93a7b8` stays, and the 2.31:1 label contrast is
  accepted knowingly. Section 09's `#4a6e92` was tried in review and rejected: the
  pale face is the design. The CSS comment records the acceptance so the next
  pass does not read it as an unpaid debt.
- **D2: ink on the mockup fill.** The `#8aa6c2` fill is untouched and the label
  moves to `--color-ink`, 4.97:1.

| # | Question | Current | Options |
| --- | --- | --- | --- |
| D1 | Button face colour | `#93a7b8` with label `#f3f7fb` = **2.31:1**, fails AA | (a) `#4a6e92` = 4.96:1, the fix section 09 supplies and the overview records as approved; (b) keep the mockup face and accept the failure; (c) darken the label instead |
| D2 | Selected pill and picked month fill | `#8aa6c2` with `#ffffff` = **2.53:1**, fails AA | (a) darken the fill to match whatever D1 lands on; (b) keep the fill and swap the text to `--color-ink` (`#3b3227` on `#8aa6c2` = 4.9:1); (c) accept the failure |

`git log` shows the button face was deliberately set back to the mockup value in
"Update waitlist UI: responsiveness, copy, and button aesthetics", so D1 is a
live preference, not a bug to quietly correct.

## In scope

- A visible focus indicator at every tab stop, including the visually hidden
  parity radios and the submit button.
- `prefers-reduced-motion: reduce` support.
- Contrast remediation for the two failing pairs above, plus the disabled month
  (`#b3a794` on `#f6f0e6` = 2.09:1) and the placeholder (`#8a7d6c` on `#cbbea8`
  = 2.19:1).
- A `<main>` landmark on both routes and a correct heading order.
- Pointer target size on the calendar year arrows (currently about 22px).
- Reflow at 320px CSS width with no horizontal scrolling, on the form, the picker
  popover, the confirmation panel and `/privacy`.
- The dial-code `<select>` affordance, deferred in the `select.well` comment in
  `app/globals.css`.

## Out of scope

- Any change to validation rules, the Zod schema, the server action, or the sheet
  write. This feature touches presentation and markup only. Step 8 is the one
  deliberate exception, and it changes only how the client dispatches the
  existing action.
- New copy, new fields, or layout the mockup does not already show.
- Dark mode, i18n, and animation beyond removing it.
- Automated accessibility tooling (axe, Lighthouse CI) and Playwright. No test
  runner is configured and this feature does not add one.
- Deployment (feature 8).

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - focus indicator at every stop** - add `:focus-visible` rules in
  `globals.css` for `.btn-inlay`, `.parity-row input:focus-visible + .pill`, the
  consent checkbox, and the footer and policy links, all using the section 05
  oxblood halo `0 0 0 2px rgba(122, 46, 46, .35)` so the page keeps one focus
  language. The parity pills are the load-bearing one: the radios are `sr-only`,
  so keyboard focus is invisible today. *Done when:* tabbing from First name to
  the submit button shows a visible ring at every stop with no gap, including
  each parity pill under arrow keys, and a mouse click still leaves no ring on
  the button.

- [x] **Step 2 - contrast pass** - apply D1 and D2 as decided, and darken the
  disabled calendar month and the placeholder to at least 3:1 against their own
  backgrounds. Rewrite the two CSS comments that currently defer to feature 7 so
  they record the decision instead of the debt. *Done when:* every pair in the
  table above is recomputed and quoted in the step summary, each meeting the
  target agreed in D1 and D2, and the desktop screenshot still matches
  `Homepage.png` apart from the agreed colours.

- [x] **Step 3 - reduced motion** - one `@media (prefers-reduced-motion: reduce)`
  block that removes the `.btn-inlay` transition and its `:active` transform.
  This is the only motion on the site, so do not add a blanket
  `* { animation: none }` reset. *Done when:* with the OS or devtools emulation
  set to reduce, pressing the button changes no position and the shadow does not
  animate; with it off the 120ms press is unchanged.

- [x] **Step 4 - landmarks and semantics** - wrap the card of `/` and `/privacy`
  in a `<main>` with the footer outside it, and move the `aria-invalid` that
  `invalidProps` puts on the parity `<fieldset>` onto something that legitimately
  carries it, keeping `aria-describedby` on the group. *Done when:* each route
  exposes exactly one `main` landmark and one `h1`, the accessibility tree shows
  the parity group named by its legend and described by its error, and no console
  or React warnings appear.

- [x] **Step 5 - target size and the select affordance** - grow `.cal-step` to at
  least a 24px square hit area without moving the year label or resizing the
  arrow glyph, and settle `select.well`: either give it a chevron drawn in the
  same ink as the calendar icon, or record in the CSS comment that the bare well
  is intentional. *Done when:* the year arrows measure 24px or more in devtools,
  the popover header is visually unchanged against the section 06 reference, and
  the dial-code control's state is decided in code with a comment saying so.

- [x] **Step 6 - 320px reflow pass** - walk `/` and `/privacy` at 320px, 360px
  and 390px wide and fix whatever overflows or crowds: the phone row's
  `minmax(112px, auto)` first column, the popover against the card padding, the
  pill row, and the button's `22px 40px` padding. Fix by adjusting the existing
  clamps and grid, not by adding a new breakpoint system. *Done when:*
  `document.documentElement.scrollWidth === clientWidth` at all three widths on
  both routes, with the picker open and with every field in its error state, and
  320px screenshots show no clipped text or control.

- [x] **Step 7 - button face returned to the mockup** - revert D1 to
  `#93a7b8` and rewrite the token comment to record the accepted AA failure
  rather than the fix. *Done when:* the button reads as it does in
  `Homepage.png` and no comment in the file still calls the colour a debt.

- [x] **Step 8 - the form keeps what was typed** - out of this feature's stated
  scope, folded in because review found it: React resets any form it drives
  through the `action` prop once the action answers, so a rejected submit
  emptied every field. The same action is now dispatched from `onSubmit`
  inside `startTransition`, which leaves the reset out of React's hands. No
  schema, action, or stored shape changed. *Done when:* submitting with a
  missing field leaves every other value in place and shows only the real
  errors, and a complete submit still reaches the confirmation panel.

## Files / areas

- `app/globals.css` - most of the work: focus rules, contrast values, the
  reduced-motion block, `.cal-step`, `select.well`, narrow-width fixes.
- `app/page.tsx`, `app/privacy/page.tsx` - the `<main>` landmark only.
- `components/waitlist/FieldError.tsx` - `invalidProps`, if Step 4 needs it.
- `components/waitlist/WaitlistForm.tsx` - markup only, if the fieldset change or
  a reflow fix requires it.
- `components/waitlist/DueMonthPicker.tsx` - only if the popover needs a narrow
  width fix that CSS alone cannot make.

## Data / contracts

None. No schema, action, type, or stored shape changes here. The
`WaitlistSignup` column order and the `due_month`, `parity` and `phone` shapes
are untouched.

## Testing

No test command is declared in `AGENTS.md`, so the test gate is off, and no step
here adds testable logic anyway; this is presentation and markup. Evidence is the
build plus browser observation.

- Every step: `npm run build` clean and `npm run lint` clean.
- Steps 1, 2, 5: desktop screenshots compared against `UI-design/Homepage.png`
  for unintended drift.
- Step 3: devtools "Emulate CSS prefers-reduced-motion: reduce", press the
  button, confirm no transform.
- Step 4: the browser accessibility tree for the landmark, the heading, and the
  parity group's name and description.
- Step 6: devtools responsive mode at 320 / 360 / 390, both routes, popover open
  and errors showing, with `scrollWidth === clientWidth` checked in the console.

Contrast numbers must be computed, not eyeballed, and quoted in the step summary.

## Notes for the AI

- The design wins over convenience. Depth comes from shadow ladders, never
  borders; do not add an outline where the spec uses a halo, and do not introduce
  a border to fix a focus or contrast problem.
- Keep one focus language: the oxblood halo already used by `.well:focus`,
  `.cal-month:focus-visible` and `.cal-step:focus-visible`.
- Use `:focus-visible`, not `:focus`, for anything a mouse click can reach, so a
  click leaves no ring behind. The wells are the existing exception and stay as
  they are.
- The parity radios and their pills are native radios styled with CSS. Do not
  replace them with a JavaScript roving tabindex; the picker grid is the only
  place that pattern belongs.
- No new dependency, no `tailwind.config.js`, no inline styles. Theme values live
  in the `@theme` block, and a new colour becomes a token if it is used more than
  once.
- No em dashes in code, comments, or commit messages.
- Where a CSS comment defers something to "feature 7", this feature must either
  fix it or rewrite the comment to record the decision. Leaving the deferral in
  place after this ships is a failed step.
