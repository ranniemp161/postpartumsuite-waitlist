# Build Plan

Design-led order. The look lands first, because the design is the requirement
everything else is judged against; behaviour is layered onto a surface that
already looks right.

## MVP

- [x] 1. **Design foundation** - transcribe the CSS specification into real code:
  `@theme` tokens in `globals.css`, the four Google fonts self-hosted through
  `next/font`, the `#kerf` SVG filter, generated paper and felt texture tiles, the
  logo mark, and the site icon replacing the Next.js default. Ends with a blank
  paper page whose ground, card, and type are provably correct.
- [ ] 2. **Waitlist form shell** - the full static form matching `Homepage.png`:
  card, logo, heading, subcopy, hairline rule, every label and pressed well,
  parity pills, consent row, and the flush-inlay button. No validation, no submit.
- [ ] 3. **Due date month picker** - the popover from section 06 with a year
  stepper and 3x4 month grid, past months disabled, closes on pick, fully keyboard
  operable.
- [ ] 4. **Validation and submit states** - one Zod schema shared by client and
  server, inline errors, submitting and disabled states, and the confirmation
  panel that replaces the form echoing first name and email.
- [ ] 5. **Google Sheets persistence** - `saveSignup()` behind a single typed
  module, service-account append, env var wiring, and failure handling that never
  silently loses a signup.
- [ ] 6. **Privacy policy page** - `/privacy` in the same paper theme, linked from
  the consent checkbox, with clearly marked placeholder text.
- [ ] 7. **Responsive and accessibility pass** - narrow-screen behaviour, name row
  stacking, focus rings, labels and aria wiring, reduced motion, and a real
  small-screen check.
- [ ] 8. **Deployment readiness** - Vercel config, London region, env vars,
  production build, and a smoke-test path.

## Post-MVP (not scheduled)

Recorded so they are not forgotten, deliberately unscheduled while this stays a
single-purpose waitlist.

- Migrate from Google Sheets to a proper datastore with real deletion and export
- Bot protection and duplicate-email handling
- Confirmation email to the signup
- Analytics and conversion measurement
- Area-based segmentation of the list
