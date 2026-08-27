# Feature 8 - Deployment readiness

**Type:** Feature
**Build plan item:** 8

## Goal

Make the deployment deliberate rather than incidental. The site is already live
on www.thepostpartumsuite.com with working env vars, so most of this feature's
outcome exists by accident. What is missing is the part the plan actually asked
for: signup processing in the UK, config that lives in the repo rather than only
in a dashboard, and a written way to tell whether a deploy is good.

## Why now

`vercel project inspect` reports the project region as **`iad1`** (Washington
DC), and a production response came back from **`sin1`** (Singapore). The plan
says London, `lhr1`, "keeping signup data in the UK".

The page itself is static and served from the edge everywhere, which is fine.
The part that matters is the **Server Action**, because that is where a signup
is decrypted from the request, validated, and sent to Google. Due month plus
parity is special category health data under UK GDPR Article 9, and it is
currently being processed on US and Asian infrastructure, contradicting the
project's own stated position and the premise the privacy policy is built on.

## In scope

- `vercel.json` pinning the function region to `lhr1`, committed to the repo
- Recording the live domain, which the overview still lists as `> TODO`
- A written smoke-test path that reflects the sheet as it is now: eleven
  columns, `DD-MM-YYYY HH:mm` timestamps, and a `signup_id`
- Noting the Bot Protection challenge response, so a future uptime monitor is
  not set up against a misleading 429

## Out of scope

- **Moving the Google Sheet.** Pinning `lhr1` moves *processing*, not *storage*.
  Where the sheet itself lives is a Google Workspace question and a bigger one;
  it is recorded as an open question, not solved here.
- **Migrating existing rows.** Signups already collected were processed wherever
  they were processed. This change is forward-looking only.
- Deploying, promoting, or changing remote settings without a separate yes.

## Build steps

Progress (survives a context clear):

- [x] Step 1 - pin the function region to `lhr1`
- [x] Step 2 - record the domain and the smoke-test path in the plans
- [x] Step 3 - run the smoke test against a real deployment

### Step 1 - pin the function region to `lhr1`

Add a `vercel.json` at the repo root setting `"regions": ["lhr1"]`.

**`vercel.json`, not `vercel.ts`.** The current platform guidance prefers
`vercel.ts` for its TypeScript support, dynamic logic, and env access. This
config is one static array and uses none of that, and `vercel.ts` requires
adding `@vercel/config` to a dependency list the project has kept deliberately
short. Three lines of JSON with no new dependency is the better trade here.
Revisit if the config ever needs logic.

**Assumption resolved.** Vercel's function-region docs state the per-plan limit
as Hobby: single region, Pro: 5, Enterprise: all, and that deploying to more
regions than the plan allows fails before the build step. One region is exactly
what this config sets, so Hobby is not a blocker. `functionFailoverRegions` is
Enterprise-only and is deliberately not used.

**Done when:** `vercel.json` exists, `npm run build` still passes, and the file
is the single source of the region rather than a dashboard setting.

### Step 2 - record the domain and the smoke-test path in the plans

Edit `blueprint/project-plan.md`: replace the domain TODO with
www.thepostpartumsuite.com, and add the smoke-test path to the deployment
section. Then update the overview's Deployment section to match.

The smoke test must reflect the sheet's current shape, not its original one:

1. Load `/` in a real browser and confirm no CSP violations in the console
2. Confirm the due-date picker and the parity radios work
3. Submit one signup with obviously-test details
4. Confirm a row appends with eleven columns: `DD-MM-YYYY HH:mm` in A and I, the
   outward code in J under its `location` header, and a uuid in K
5. Delete the test row
6. Load `/privacy` and confirm it renders

Record alongside it that **an automated check against `/` gets HTTP 429 with
`X-Vercel-Mitigated: challenge`**, because Bot Protection challenges non-browser
clients. A monitor configured naively against that will report the site down
when it is healthy.

**Done when:** the plans and overview carry the domain and the smoke test, with
no `> TODO` left in the Deployment section.

### Step 3 - run the smoke test against a real deployment

The region cannot be confirmed from a local build; it needs a deployment. Two
routes, and **both need a separate explicit yes**, because either one is an
outward-facing action:

- a preview deployment via `vercel deploy`, which verifies before production
- or production, after `/complete` merges and pushes

Confirm the region by reading `x-vercel-id` on a **POST** to `/`, since only the
function is regional. A `lhr1` prefix is the pass.

**Done when:** a deployed response shows the Server Action executing in `lhr1`,
and the smoke-test steps above pass against that deployment.

## Files and areas

- `vercel.json` (new)
- `blueprint/project-plan.md`, `blueprint/context/project-overview.md`

No application code changes. Nothing in `app/`, `lib/`, `actions/` or
`components/` is touched, which is why this feature carries no regression risk
to the form itself.

## Data and contracts

None changed. The sheet contract, the schema, and the Server Action are
untouched.

## Testing

No test runner is configured, so the gate is off. This feature adds no logic, so
there is nothing a unit test would cover. Evidence is the build, the deployed
response headers, and the smoke test.

## Notes

- The region change affects new invocations only, not data already collected
- Static assets stay globally distributed regardless of this setting; only the
  Server Action becomes UK-bound
- If Hobby cannot pin a region, say so plainly and record it as a constraint;
  do not silently accept `iad1` while the plan says London

## Verification record

| Done-when | Proof |
| --- | --- |
| Region pinned in the repo | `vercel.json` with a single `lhr1` entry; docs confirm Hobby allows one region and that exceeding the plan fails before the build step |
| Function executes in London | Preview deployment, POST to `/`: `X-Vercel-Id: sin1::lhr1::...`. The paired GET returned `sin1::` alone, since a static GET runs no function |
| Domain recorded | `www.thepostpartumsuite.com` in both plan and overview; the TODO is gone |
| Smoke test written | Seven steps in the plan and overview, matching the sheet's current eleven-column shape |
| Build | `npm run build` compiled and type-checked clean |

Not done here, and needing a human on the production deployment:

- The browser half of the smoke test: console clean on `/` and `/privacy`, the
  picker and parity radios, and one real submit checked in the sheet then deleted.
  Preview shares the live sheet's env vars, so a real submit was not made here.
