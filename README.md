# PostpartumSuite Waitlist

A Next.js waitlist site for PostpartumSuite.

> TODO: replace this line with the real product description once
> `blueprint/project-plan.md` is filled in.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm run build` | Production build (also type-checks) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint 9 flat config |

No test runner is configured yet.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, ESLint 9, npm.

## Working on this project

Agent instructions and conventions live in [AGENTS.md](AGENTS.md) and
`blueprint/context/`. Design references are in `UI-design/`.

## Google Sheet setup

Signups are appended as rows to a Google Sheet by a service account. To set this
up from scratch:

1. In a Google Cloud project, enable the **Google Sheets API**.
2. Create a **service account**, then **Keys -> Add key -> Create new key ->
   JSON**. Keep the downloaded file out of the repo.
3. Create the sheet. Rename the first tab to `Signups` and put this header row
   in `A1:I1`, in exactly this order:

   `created_at`, `first_name`, `last_name`, `email`, `phone`, `due_month`,
   `parity`, `consent`, `consent_at`

4. **Share the sheet with the service account's `client_email` as Editor.** This
   step is easy to miss, and skipping it fails as a 403 that reads like an auth
   problem rather than a permissions one.
5. `cp .env.example .env.local` and fill in the three values. The
   `GOOGLE_PRIVATE_KEY` quoting note in that file matters.

The column order is the schema: `lib/sheets.ts` writes positionally, so reordering
or inserting a column in the sheet silently corrupts every later signup.
