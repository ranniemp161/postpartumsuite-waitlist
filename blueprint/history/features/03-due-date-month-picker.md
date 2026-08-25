# Feature: Due date month picker

**From build-plan:** feature 3
**Status:** complete

## Goal

Turn the static due-date trigger that feature 2 shipped into a working picker: a
popover holding a year stepper and a 3x4 month grid, past months disabled, that
writes `YYYY-MM` into a hidden `due_month` input and echoes the choice on the
trigger face.

This is the first interactive control in the project, so it also sets the client
boundary: the form stays a server component and only the picker is `'use client'`.
Feature 4 validates the value this feature produces, and feature 5 writes it to
the sheet, so the `YYYY-MM` contract locked here is load-bearing.

## Design reference

**Authority: the two images in `UI-design/`**, linked rather than copied into
`blueprint/reference/` because they total 13MB, the precedent features 1 and 2
already set.

- [UI-design/design-token.png](UI-design/design-token.png) - the CSS
  specification. **Section 06's calendar block is this feature's scope**; its
  parity pill block shipped in feature 2, and sections 01-05 and 07-08 are done.
- [UI-design/Homepage.png](UI-design/Homepage.png) - the rendered page. It shows
  the picker **closed only**, so the trigger's resting state is fixed by the image
  and the open popover is fixed by section 06's CSS.

The image is 1920px wide at DPR 1.25, so **divide any pixel measured off
`Homepage.png` by 1.25** to get CSS pixels.

Section 06 is transcribed verbatim in **Appendix A** so implementation reads text
rather than re-reading a screenshot. Where the appendix and the image disagree,
the image wins.

## In scope

- `components/waitlist/DueMonthPicker.tsx` - a new `'use client'` component that
  replaces the static trigger markup inside `WaitlistForm.tsx`
- `lib/due-month.ts` - the pure helpers: `YYYY-MM` formatting, month labels, the
  past-month test, and the year bounds
- The popover shell, month grid, year stepper, selected and disabled month
  styling in `app/globals.css`, from spec section 06
- The hidden `due_month` input that carries the value to feature 4's action
- Keyboard operation: Escape closes and returns focus, arrow keys move within the
  grid, the trigger is the single tab stop when closed
- Outside-click dismissal, `aria-expanded` / `aria-haspopup` wiring

## Out of scope

- **Validation and required-ness** (feature 4). Nothing here rejects an empty
  due date or renders an error; the picker only makes a valid value selectable.
- **Submitting anything** (features 4 and 5). The form still has no action.
- **The confirmation panel** (feature 4).
- **Narrow-screen behaviour and the reduced-motion pass** (feature 7). The
  popover uses `width:min(340px,100%)` from the spec, which already survives a
  narrow card, but no breakpoint work is done here.
- **Re-opening the pill contrast debt.** `#8AA6C2` under white is the spec value
  and stays; feature 7's accessibility pass owns it.
- Any change to the other fields, the button, or the card.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - The month helpers.** `lib/due-month.ts`: `toDueMonth(year,
  monthIndex)` returning `YYYY-MM`, `MONTH_LABELS` (12 short labels for the grid)
  and a full-label formatter for the trigger face, `isPastMonth(year, monthIndex,
  today)` and the `[currentYear, currentYear + 1]` year bounds. Every function is
  pure and takes "today" as an argument rather than calling `new Date()` inside.
  *Done when:* `npm run build` passes and each helper is exported and typed with
  no `any`; nothing renders yet.

- [x] **Step 2 - The popover shell in CSS.** Section 06's popover recipe plus the
  3x4 grid, month cell, selected and disabled states, and the year stepper row,
  added to `app/globals.css` as `@layer components`. Applied to static markup in
  the picker component, forced open, so the surface can be seen before any state
  exists.
  *Done when:* a screenshot shows the cream `#F6F0E6` panel floating 8px under the
  trigger with the spec's shadow ladder, 12 months in three columns, and the year
  row above them.

- [x] **Step 3 - Open, pick, close.** Make the component real: `useState` for open
  and for the selected `YYYY-MM`, the trigger toggles, clicking a month selects it,
  writes the hidden input, updates the trigger face from placeholder to ink, and
  closes the popover. Past months of the current year render disabled and do not
  respond. The popover only mounts while open.
  *Done when:* picking a month in the browser closes the panel, the trigger reads
  e.g. `March 2027`, `document.querySelector('[name=due_month]').value` is
  `2027-03`, and a past month cannot be picked.

- [x] **Step 4 - The year stepper.** Previous and next controls around the year
  label, bounded to the current year and the next one, with the out-of-range
  control disabled rather than hidden. Stepping re-renders the grid and re-applies
  the past-month rule to the visible year only.
  *Done when:* next moves to the following year and every month there is enabled;
  previous returns and is disabled at the current year.

- [x] **Step 5 - Keyboard and dismissal.** Escape closes and returns focus to the
  trigger; a click outside closes without changing the value; arrow keys move
  between months with roving `tabindex` so the grid is one tab stop; opening moves
  focus into the grid. `aria-haspopup="dialog"`, `aria-expanded`, and a labelled
  `role="dialog"` on the panel.
  *Done when:* the whole control is operable from the keyboard alone, with no
  mouse, from trigger to selected value, and Escape leaves focus on the trigger.

## Files / areas

| Path | Change |
| --- | --- |
| `lib/due-month.ts` | new - pure month helpers |
| `components/waitlist/DueMonthPicker.tsx` | new - the `'use client'` picker |
| `components/waitlist/WaitlistForm.tsx` | edit - the static trigger block is replaced by `<DueMonthPicker />`; the rest is untouched |
| `app/globals.css` | edit - one new `@layer components` block for section 06 |

`app/page.tsx` and `app/layout.tsx` do not change.

## Data / contracts

**Load-bearing. Features 4 and 5 read this and the overview locks it.**

| Name | Shape | Notes |
| --- | --- | --- |
| `due_month` (hidden input) | `YYYY-MM`, e.g. `2027-03` | never a full date, never a label string |
| empty state | the input is present with `value=""` | feature 4 rejects it, this feature does not |

- The month index is 0-based internally (matching `Date`) and only ever leaves
  `lib/due-month.ts` as the padded 1-based string.
- "Past" means strictly earlier than the current calendar month in the visitor's
  local time. The current month itself is selectable.
- **Assumption to confirm:** the year stepper is bounded to the current year and
  the next one. A due date more than roughly nine months out is not a real
  pregnancy, so this is deliberately tight. Say so if you want a wider range.

## Testing

**No test runner is configured** (`AGENTS.md` declares no `test` command), so the
gate is off and every step verifies with the browser plus `npm run build`.

`lib/due-month.ts` is exactly the kind of pure logic the gate would cover -
`isPastMonth` at a year boundary and the zero-padding in `toDueMonth` are the
two places a wrong answer is possible. If `/tests` is run before or during this
feature, those are the first tests to write.

Manual path, once step 5 lands:

1. `npm run dev`, open `http://localhost:3000`.
2. Click **Birth due date**: the cream panel opens under the trigger.
3. Months before the current one are greyed and unclickable.
4. Pick one: the panel closes, the trigger shows the month and year in ink.
5. Reopen: the chosen month is shown selected.
6. Step the year forward and back; previous is disabled at the current year.
7. Escape closes and the trigger keeps focus; a click on the card closes it too.
8. Repeat the whole flow with Tab, arrows, Enter and Escape only.

## Notes for the AI

- **Only `DueMonthPicker.tsx` gets `'use client'`.** `WaitlistForm` stays a server
  component and simply renders the picker, which is why the picker owns the whole
  field block including its `<label>`.
- **The popover must not render while closed.** That is what keeps `new Date()`
  off the server render: no hydration mismatch is possible if today's date is only
  read after mount. Do not compute the disabled set during the server pass.
- **The trigger keeps its feature-2 markup**: `.well` styling, `id`, the calendar
  glyph, and the roman (not italic) placeholder text, which `Homepage.png` fixes.
  Moving it into the new component must not change how it looks when closed.
- **Section 06 is written for a 7-column day grid.** The 3x4 month grid is the
  approved deviation recorded in the overview, so translate the recipe rather than
  copying it: keep the popover shell, cell, selected and disabled values exactly,
  and change only `grid-template-columns` and the gap. Comment the deviation where
  it lands.
- **The spec has no year stepper styling.** Build it from tokens already in
  `globals.css` (`--font-label` for the year, `--color-ink-soft` for the arrows)
  rather than inventing new colours.
- Selected month is the spec's `#8AA6C2` on `#FFFFFF`, the same known contrast
  debt as the pills. Leave it; feature 7 decides.
- Follow the existing CSS conventions in `globals.css`: scoped classes in
  `@layer components`, never a bare element selector, and comments that explain
  the material reason, not the property.
- No new dependency. No headless UI library, no date library.

---

## Appendix A - spec section 06, verbatim

Transcribed from `UI-design/design-token.png`. The parity pill half of this
section shipped in feature 2 and is omitted.

```css
/* trigger sits in a relative wrapper; popover is absolute */
popover{
  position:absolute; top:100%; left:0; margin-top:8px; z-index:20;
  width:min(340px,100%); padding:16px 16px 18px;
  border-radius:3px; background:#F6F0E6;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.9),
    0 18px 34px -14px rgba(74,56,40,0.45),
    0 0 0 1px rgba(74,56,40,0.16);
}
grid{ display:grid; grid-template-columns:repeat(7,1fr); gap:3px; }  /* Mon-first */
weekday head{ font-family:'IM Fell English SC'; font-size:11px;
              letter-spacing:0.08em; text-transform:uppercase; color:var(--ink-soft); }
day{ border:0; border-radius:2px; padding:9px 0; font-size:15.5px;
     background:transparent; color:var(--ink); cursor:pointer; }
day[disabled] (past){ color:#B3A794; }
day[selected]{ background:#8AA6C2; color:#FFFFFF;
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.4),
             0 2px 5px -2px rgba(46,68,92,0.6); }
```

### 09 - behaviour note for the calendar

```text
Calendar    Monday-first grid, month stepper, closes on pick, stores a Date
```

Superseded by the approved deviation in the overview: a year stepper and a 3x4
month grid, storing `YYYY-MM`. "Closes on pick" still holds.
