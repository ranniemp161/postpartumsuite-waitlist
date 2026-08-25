# Feature: Validation and submit states

**From build-plan:** feature 4
**Status:** complete

## Goal

Make the form real. One Zod schema, imported by both the client and the server
action, decides what a valid signup is; the visitor gets inline errors on the
field that is wrong, a button that shows it is working, and a confirmation panel
that replaces the form in place and echoes their first name and email.

This feature owns the shape every later feature depends on. Feature 5 writes
exactly what this schema outputs, so the normalisation decided here (lowercased
email, E.164 phone, `YYYY-MM` due month, integer parity) is the sheet's contract.

## Design reference

`UI-design/Homepage.png` is the authority for the form itself, already built in
features 2 and 3. Nothing in this feature changes that resting layout.

**There is no mockup for the confirmation panel or the error state.** Both are
composed from primitives already in `app/globals.css`: heading type, body copy,
the hairline rule, and the oxblood accent that section 05 already uses for the
focus halo. If a render of either exists, save it under `blueprint/reference/`
and link it here before step 6.

## In scope

- `zod` added as a dependency
- One schema module, `lib/waitlist-schema.ts`, imported unchanged by client and server
- `toE164()` phone normalisation as a separate pure helper
- One Server Action that validates and returns a typed result, with no persistence
- Inline, per-field error messages, announced rather than colour-only
- Submitting state: disabled button, changed label, no double submit
- Live re-validation after a first failed submit, using the same schema
- Confirmation panel replacing the form in place, echoing first name and email
- Error and disabled styling in `app/globals.css`

## Out of scope

- **Writing anything anywhere.** The action validates and returns success without
  saving. Feature 5 adds `saveSignup()` behind the marked call site.
- Duplicate email detection, bot protection, rate limiting (all post-MVP)
- `/privacy` (feature 6). The consent link keeps pointing at a 404.
- Narrow-screen layout, the full focus-ring and reduced-motion pass (feature 7)
- Toast or banner libraries. Feedback renders inline.
- Any change to `Homepage.png` fidelity in the resting state

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - phone helper and schema** - `npm i zod`, then write `lib/phone.ts`
  (`toE164(dialCode, national)`) and `lib/waitlist-schema.ts` exporting
  `waitlistSignupSchema` and the inferred `WaitlistSignupInput`. Field rules,
  messages, and normalisation all live here; nothing imports it yet.
  *Done when:* `npm run build` is clean, and the exported type matches the Data
  contracts table below field for field.

- [x] **Step 2 - server action** - `actions/waitlist.ts` with `'use server'`,
  parsing `FormData` through the schema and returning the `WaitlistFormState`
  union below. On success it returns the echo values only; a `// feature 5:
  saveSignup() lands here` comment marks the insertion point. Wrapped in
  try/catch returning a generic form-level message, never raw error text.
  *Done when:* `npm run build` is clean and the action's return type is the union
  below, with no `any`.

- [x] **Step 3 - wire the form up** - `WaitlistForm` becomes a client component
  using `useActionState`; the button becomes `type="submit"`, disables while
  pending, and changes its label in that state. No error rendering yet.
  *Done when:* in the browser, submitting a filled form leaves the URL unchanged
  (no query-string navigation), the button visibly disables for the duration, and
  a second click while pending does nothing.

- [x] **Step 4 - inline errors** - render the returned `fieldErrors` under each
  field, wire `aria-invalid` and `aria-describedby`, put each message in a polite
  live region, and add `.field-error` plus the invalid-well halo to `globals.css`.
  Covers the parity fieldset, the consent row, and the date trigger, not only the
  text inputs.
  *Done when:* submitting a completely empty form shows a message under every
  required field including parity, due date, and consent; screenshot attached;
  each message is reachable by `aria-describedby`, not signalled by colour alone.

- [x] **Step 5 - live re-validation** - after the first failed submit, re-validate
  the changed field against the same schema on change (and on blur for the text
  inputs), clearing its message as soon as it is fixed. Silent before the first
  failed submit, so a half-typed email never turns red.
  *Done when:* submit empty, then type a valid email; that one message clears
  while the others stay. Typing before any submit shows nothing.

- [x] **Step 6 - confirmation panel** - `components/waitlist/ConfirmationPanel.tsx`
  replaces the form (not the logo, heading, or subcopy) on success, echoing first
  name and email, styled from existing tokens.
  *Done when:* a valid submit swaps the form for the panel with no navigation,
  the panel shows the submitted first name and the lowercased email, and no
  console errors appear; screenshot attached.

## Files / areas

| File | Change |
| --- | --- |
| `package.json` | adds `zod` |
| `lib/phone.ts` | new - `toE164`, pure |
| `lib/waitlist-schema.ts` | new - the shared schema, the only definition of valid |
| `actions/waitlist.ts` | new - the single submit path |
| `components/waitlist/WaitlistForm.tsx` | becomes a client component, gains state, errors, submit |
| `components/waitlist/DueMonthPicker.tsx` | accepts an error / `aria-invalid` prop and reports changes upward |
| `components/waitlist/ConfirmationPanel.tsx` | new |
| `app/globals.css` | `.field-error`, invalid well halo, disabled button face |
| `app/page.tsx` | unchanged |

## Data / contracts

**Load-bearing. Feature 5 appends these values, in this order, as sheet columns.**

Schema output (`WaitlistSignupInput`):

| Field | Type | Rule and normalisation |
| --- | --- | --- |
| `first_name` | string | required, trimmed, 1-60 |
| `last_name` | string | required, trimmed, 1-60 |
| `email` | string | required, email-shaped, trimmed, **lowercased** |
| `phone` | string | built from `dial_code` + `phone_national` via `toE164`, digits only after the `+` |
| `due_month` | string | `YYYY-MM`, months 01-12, not earlier than the current month |
| `parity` | 1 to 5 | coerced from the radio's string value |
| `consent` | true | literal true; false or missing is an error |

`created_at` and `consent_at` are **not** produced here. They are stamped inside
`saveSignup()` in feature 5, so one module owns the clock.

Action state:

```ts
type WaitlistFormState =
  | { status: "idle" }
  | { status: "invalid"; fieldErrors: Partial<Record<WaitlistField, string>> }
  | { status: "failed"; message: string }
  | { status: "success"; firstName: string; email: string };
```

A discriminated union rather than the `{ success, data, error }` shape in
`coding-standards.md`, because `useActionState` carries one value and that value
has to hold per-field messages. Deliberate, and the only place it differs.

Form field names stay exactly as feature 2 shipped them: `first_name`,
`last_name`, `email`, `dial_code`, `phone_national`, `due_month`, `parity`,
`consent`. `WaitlistField` is keyed on those names, not on the schema's output
keys, so a phone error can point at `phone_national`, where the visitor can see
it.

## Testing

**No test runner is configured, so the test gate is off** (see Commands in
`AGENTS.md`). Steps 1 and 2 verify with `npm run build`; steps 3 to 6 verify with
the running app plus a screenshot.

`lib/phone.ts` and `lib/waitlist-schema.ts` are exactly the logic the overview
names as worth covering: pure, with real edge cases (leading zero, spaces, an
already-`+44` number, an empty due month, a past due month, parity as a string).
If you want them tested, run `/tests` **before step 1** so the gate is on when the
logic lands. Retrofitting after step 6 is the worse order.

Manual pass at the end:

1. Submit empty - every required field shows a message, nothing is saved.
2. An email typed as `USER@Example.COM` with a trailing space - accepted, and
   the confirmation echoes it lowercased and trimmed.
3. Phone `07700 900123` with `+44` - normalises to `+447700900123`.
4. Pick a due month, and confirm a past month is still unpickable in the popover.
5. Untick consent on an otherwise valid form - blocked.
6. Valid submit - confirmation panel, no navigation, no console errors.

## Notes for the AI

- **The action deliberately saves nothing.** Between this feature and feature 5
  the page tells a visitor they have joined a list that does not exist. Do not
  deploy in that window, and do not paper over it with a fake delay.
- The server action is the authority. Client-side validation exists to avoid a
  round trip and to clear messages live; it never decides what is accepted.
- Check the installed `zod` version's error API before using it. Zod 4 changed how
  issues are flattened; do not assume `error.flatten()` from memory.
- `DueMonthPicker` already holds the selected month in its own state and posts a
  hidden input. Keep that. Lift only what step 5 needs in order to re-validate,
  and do not turn it into a controlled component owned by the form.
- Never surface raw error text or a stack trace. The `failed` branch is one fixed,
  friendly sentence.
- Errors must not be colour-only: message text plus `aria-invalid` plus
  `aria-describedby`, inside a polite live region.
- The button keeps its flush-inlay character when disabled. Reduce contrast; do
  not add a shadow or lift, and do not add a spinner (no animation library, and
  motion beyond the 120ms transition is out of character).
- `app/page.tsx` has an **uncommitted, unrelated copy edit** ("in your area"
  removed). That belongs to the open "your area" question, not this feature.
  Decide before branching whether to commit it separately or stash it, so it does
  not ride into this feature's commit.
