# Coding Standards

> Tuned by `/onboard` on 2026-08-25 to the stack this repo actually has:
> Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS v4, ESLint 9,
> npm. No database, ORM, auth, component library, or test runner is installed yet;
> those sections carry a `> TODO` until the choice is made.
>
> Keep this current as the stack grows. Replace a TODO with the real convention
> when you adopt a tool, rather than letting the code drift from this file.

## TypeScript

- Strict mode enabled
- No `any` types - use proper typing or `unknown`
- Define interfaces for all props, API responses, and data models
- Use type inference where obvious, explicit types where helpful

## React

- Functional components only (no class components)
- Use hooks for state and side effects
- Keep components focused - one job per component
- Extract reusable logic into custom hooks

## Next.js

- Next.js 16, App Router, React 19
- Server components by default
- Only use `'use client'` when needed (interactivity, hooks, browser APIs)
- Use Server Actions for form submissions and simple mutations, such as the
  waitlist signup
- Use route handlers (`app/api/<name>/route.ts`) when you need:
  - Webhooks
  - File uploads with progress tracking
  - Long-running operations
  - Specific HTTP status codes or headers
  - Endpoints for future mobile or CLI clients
  - Third-party integrations
- Otherwise, fetch data directly in server components
- Before using an API you are unsure about, read the relevant guide in
  `node_modules/next/dist/docs/`. Next 16 changed conventions that older training
  data remembers differently (see the Next.js block at the bottom of `AGENTS.md`)

## File Organization

This project has **no `src/` directory**. The App Router lives at the repo root,
and `@/*` maps to `./*` (see `tsconfig.json`).

- Routes and pages: `app/[route]/page.tsx`
- Root layout and global styles: `app/layout.tsx`, `app/globals.css`
- Components: `components/[feature]/ComponentName.tsx`
- Server Actions: `actions/[feature].ts`
- Types: `types/[feature].ts`
- Lib and utils: `lib/[utility].ts`
- Design references: `UI-design/`
- Import through the alias: `import { Foo } from "@/components/foo"`

> Only `app/` and `public/` exist today. Create the other folders when the first
> file needs one; do not scaffold empty directories.

## Naming

- Components: PascalCase (`ItemCard.tsx`)
- Files: Match component name or kebab-case
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Types/Interfaces: PascalCase (no prefix)

## Styling

- Tailwind CSS v4 for all styling
- CSS-first config: theme variables live in the `@theme inline` block of
  `app/globals.css`. There is no `tailwind.config.js`, and there should not be one
- PostCSS wiring via `@tailwindcss/postcss` in `postcss.config.mjs`
- No inline styles
- shadcn/ui is **not installed**. Add it as a deliberate step or an explicit ask,
  never silently mid-feature

> TODO: palette, typography, and the light/dark direction are unsettled. The
> scaffold defaults to light with a `prefers-color-scheme` dark override.
> Reference screenshots live in `UI-design/`; confirm the intended look before
> building UI, and follow the visual-replication rule in `ai-interaction.md`.

## Data

There is **no database, ORM, or auth in this project yet**. `package.json` has
only `next`, `react`, and `react-dom` as dependencies.

> TODO: choose where waitlist signups are stored (hosted Postgres, an email
> service list, a form provider) in `project-plan.md` before the first data
> feature. Record the real conventions here once chosen, including the migration
> workflow if an ORM is introduced.

- Validate all external input (form submissions, route handler bodies) before use
- Never trust a client-supplied user or record id
- Keep secrets in `.env.local`, which `.gitignore` already excludes. Never commit
  real keys, and never read a secret from a client component

## Data Fetching

- Server components fetch directly on the server
- Client components call Server Actions
- Validate inputs at the boundary. A schema validator (Zod) is not installed yet;
  add one with the first feature that accepts user input

## Error Handling

- Use try/catch in Server Actions and route handlers
- Return a `{ success, data, error }` shape from actions
- Show user-friendly messages. Never surface raw error text or stack traces to the
  user. No toast library is installed, so render feedback inline until one is
  added deliberately

## Testing

The blueprint installs no test runner; testing is opt-in at the project level,
because the overlay can't know your stack. Adding unit testing is an explicit
setup task the AI can do through the normal workflow, either as a build-plan item
or with `/tests`. The setup should choose the stack-native runner, wire the
scripts or commands, add a small example test, and update the Commands section
of `AGENTS.md`.

When `AGENTS.md` declares a `Verify` command, treat it as the umbrella automated
gate. It combines only the checks this project actually has, in this order when
available: typecheck, tests, then build. The command does not enable an absent
test runner or replace focused evidence. It gives local work and optional CI one
exact command to run. `/ci` owns Verify and CI setup. `/tests` adds the real test
command to Verify when it already exists, but never creates CI only because
testing was configured.

**The opt-in switch is one signal: a `test` command in the Commands section of
`AGENTS.md`.** Declare one and **tests become a gate for logic-bearing steps**,
not an optional extra; leave it out and the loop verifies logic with the evidence
it already uses (run it, a screenshot, the build). Adding the runner is itself a
deliberate step, never a silent mid-step install. This is the single definition
of the switch; the skills and `ai-interaction.md` only point back here.

- **What to test (the scope rule):** pure logic where a wrong answer is possible -
  parsers, formatters, validators, id/slug builders, server actions. These have
  assertable inputs and outputs and real edge cases (empty, missing, malformed).
- **What not to test:** UI components and integration-level surfaces (render or
  export routes, anything driving a real browser or external service). Verify those
  with a screenshot and the build, not brittle unit tests.
- **The gate (when a runner is configured):** a build step that adds in-scope logic
  must ship a passing test in the same reviewable diff. The project's test command
  must be green before the step is approved, before any checkpoint commit, and
  before `/complete` merges. UI and integration-only steps are exempt and ride on
  screenshot plus build evidence.
- **When it's named:** the `/feature` spec's Testing section predicts the coverage,
  `/implement` writes the test with the step, and if a step surfaces logic the spec
  didn't foresee, add a focused test then.
- An empty suite should fail, not pass, so "no tests ran" never looks like "passed".
- Test files live next to source files (for example `feature.test.ts`).
- Run them via the project's test command (see Commands in `AGENTS.md`), not a
  hardcoded tool name.

Stack binding (swap for yours): a TypeScript app uses Vitest, `vi.mock()` for
external dependencies (Prisma, Clerk, etc.), and `vi.useFakeTimers()` for
time-dependent logic; a Python app would use pytest; a Go app `go test`.

## Browser Verification

For UI and integration behavior, prefer real browser evidence over reading the
code and assuming it works.

- If Playwright is already installed, or the Commands section of `AGENTS.md`
  declares a Playwright script, use Playwright for browser checks, screenshots,
  console-error checks, and user-flow verification.
- If Playwright is not installed, do not add it silently in the middle of an
  unrelated feature. Use the available dev server, browser screenshots, build
  output, API output, or manual verification evidence instead.
- Add Playwright only when the user asks for it, or when the current spec is
  explicitly about setting up browser automation.
- Browser evidence is especially important for flows that click, type, submit,
  navigate, download files, render complex layouts, or depend on client-side
  state.

## Code Quality

- No commented-out code unless specified
- No unused imports or variables
- Keep functions under 50 lines when possible

## Comments

Write code that explains itself; comment only what the code cannot say.
Over-commenting is a common AI tell, so resist it.

- Comment the **why**, not the **what**. Delete any comment that restates the code.
- No banner/header blocks, section dividers, or step-by-step narration of obvious
  code. A file does not need a comment announcing each region.
- A comment earns its place only when it captures something the code can't: a
  non-obvious decision, a gotcha or workaround, why a value is what it is, or a
  link to a spec or issue.
- Prefer self-documenting names and small functions over explanatory comments.
- Keep doc comments minimal: a one-line purpose on an exported type or function is
  plenty; don't write JSDoc that just repeats the signature.
- When in doubt, leave the comment out.

## Writing

- No em dashes (U+2014) in generated content: docs, comments, commit messages,
  READMEs, specs. They read as AI-generated.
- Use a hyphen for `term - description` separators; rephrase prose with commas,
  parentheses, or a colon. Avoid en dashes and the ellipsis character too.
