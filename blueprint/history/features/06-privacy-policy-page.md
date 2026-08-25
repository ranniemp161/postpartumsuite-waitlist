# Feature: Privacy policy page

**From build-plan:** feature 6
**Status:** complete

## Goal

The consent checkbox has linked `/privacy` since feature 2, and until now that
link went nowhere. This feature gives it a real destination: a policy page in the
same paper theme that describes, accurately, what the form collects, why it is
allowed to hold it, where it goes, and how to get it removed.

## In scope

- `/privacy` as a static route in the card treatment, with long-form prose styles
  the waitlist card never needed.
- A shared footer on both routes carrying the privacy link, a contact address,
  and a copyright line.
- `lib/site.ts` for the two values the footer and the policy both need, so the
  contact address is written once.
- The layout change that lets a footer sit below the card.

## Out of scope

- Legally reviewed wording. The page carries a `TODO` marking it unreviewed.
- A settled retention period, which is still an open question in the overview.
- Cookie banner or consent management. The site sets no cookies and self-hosts
  its fonts, which the page says.

## Build steps

- [x] **Step 1 - `lib/site.ts` and the footer** - `CONTACT_EMAIL` and `SITE_NAME`,
  consumed by `components/site/SiteFooter.tsx`. The footer sits on the sheet, not
  the card, so it takes the flat printed treatment from section 03 rather than
  the pressed one. `app/layout.tsx` becomes `flex-col` so the footer stacks under
  the card instead of beside it.
- [x] **Step 2 - the policy page** - `app/privacy/page.tsx` with per-topic
  headings, a lead paragraph, and a link back to the waitlist. Content is a
  factual account of what the code actually does: the six collected fields,
  explicit consent as the Article 9 condition, the private sheet as the store,
  and the rights paragraph pointing at the contact address.
- [x] **Step 3 - `.policy` styles** - prose type scale, uppercase label-face
  headings, lists and links, scoped under one class because `.policy` only ever
  wraps this page.

## Files / areas

- `app/privacy/page.tsx` - the page, new
- `components/site/SiteFooter.tsx` - the footer, new
- `lib/site.ts` - shared site constants, new
- `app/globals.css` - `.site-footer` and `.policy` component layers
- `app/layout.tsx` - column stacking
- `app/page.tsx` - renders the footer under the card

## Done when

- [x] The consent checkbox's `privacy policy` link reaches a real page.
- [x] The page states every field the form collects, and the list matches
  `WAITLIST_FIELDS` and the parity options as built.
- [x] Both routes carry the footer, and the footer's contact address matches the
  one in the policy body.
- [x] `npm run build` and `npm run lint` are clean.

## Testing

No test runner is configured, so the gate is off. This feature adds no logic
worth covering: the page is static prose and the footer's only computed value is
the current year.

## Notes for the AI

This spec was written after the work, during a reconciliation of uncommitted
changes found on `main`. The design revision that arrived alongside it was
separated into its own commit first, so this feature's diff is only the policy
page, the footer, and the styles they need.
