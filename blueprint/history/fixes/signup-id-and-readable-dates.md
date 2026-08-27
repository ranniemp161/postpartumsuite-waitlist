# Stable signup id, readable timestamps, retention and duplicate policy

**Type:** Fix

## The problem

Four of the overview's open questions, resolved together because they all touch
the sheet contract and the privacy policy.

1. **No stable identifier.** Row position is the only identity a signup has,
   which makes a UK GDPR erasure request manual and error-prone, and gets worse
   with every row added.
2. **Timestamps are not readable.** `created_at` and `consent_at` are written as
   ISO 8601 UTC strings, for example `2026-08-27T19:51:04.123Z`. The team reads
   the sheet directly and wants `DD-MM-YYYY HH:mm`.
3. **No retention period.** UK GDPR Article 5(1)(e) requires one, and the
   privacy policy has to state it. `app/privacy/page.tsx:15` records that it is
   still undecided.
4. **No duplicate policy.** Whether a repeat email is rejected, merged, or
   allowed is undefined.

## The fix

Decisions being locked in, with the reasoning, because each changes the sheet
contract that later work depends on.

### Identifier: `crypto.randomUUID()`, not a ULID

Reversing the earlier suggestion of a ULID. A ULID's selling point is
chronological sortability, and `created_at` already provides that, so the ULID
would buy nothing while costing a hand-rolled base32 encoder. `randomUUID()` is
in `node:crypto`, needs no dependency, and is already imported in `lib/sheets.ts`.

### Duplicates: allow, deduplicate on read

Not a code change. Recording the decision and why, so it is not reopened.

`saveSignup()` has no retry queue: a failed write shows the visitor "please try
again" and they resubmit. Rejecting duplicates would break exactly that recovery
path, refusing a second attempt on the strength of a first that never landed.
Rejecting would also tell an anonymous visitor whether a given email is already
on a list that reveals pregnancy.

### Retention: due month plus 18 months

Tied to `due_month` rather than signup date because it follows the purpose: a
mother due in March 2027 is not a postpartum-care prospect by late 2028. There
is no automated deletion and this fix does not add one; it is a documented
manual process against a sheet filter.

### Timestamps: a real datetime, formatted, not a formatted string

**Do not write `"27-08-2026 19:51"` as text.** Text in `DD-MM-YYYY` sorts by day
of month, so the sheet would order 01-09 before 27-08 and every sort, filter and
chart the team builds would be silently wrong.

Write a real Google Sheets datetime instead (a serial number: days since
1899-12-30, with the time as the fractional part) and attach a number format of
`dd-mm-yyyy hh:mm`. The cell then *displays* exactly the requested format while
remaining a true datetime that sorts, filters and compares correctly.

This needs `appendCells` to send `userEnteredFormat` alongside `userEnteredValue`
and to widen its `fields` mask, which currently says `userEnteredValue` only.

**Timezone: Europe/London, not UTC.** The team reads these times expecting UK
clock time; leaving them UTC would show every summer signup an hour early. This
means the stored instant is rendered against a UK wall clock, and BST/GMT is
handled by the platform's timezone data rather than by hand.

**Rows already written stay ISO text.** This changes new rows only, so columns A
and I will hold a mix of old text and new datetimes. That is unavoidable without
rewriting history in the sheet, and is the same trade already accepted for
`postcode_outward`. The team can reformat the older cells by hand if they care.

Must not break: the fixed column order, the "never lose a signup" guarantee, the
redacted failure log, or the honeypot.

## Build steps

Progress (survives a context clear):

- [x] Step 1 - append `signup_id` as column K
- [x] Step 2 - write readable, sortable timestamps
- [x] Step 3 - state retention and erasure on the privacy page
- [x] Step 4 - record the decisions in the plans

### Step 1 - append `signup_id` as column K

Add `signup_id` to the end of `SheetRow` and generate it in `toSheetRow()` with
`crypto.randomUUID()`. Append only, never insert: rows already in the sheet are
fixed text and a mid-row insert would leave every earlier signup reading against
the wrong headers.

Include the id in the `WAITLIST_SIGNUP_UNSAVED` log line. A lost signup that has
an id is far easier to reconcile than one identified only by an email hash.

**Done when:** a successful submit writes a UUID in column K, and a forced
failure logs the same id.

### Step 2 - write readable, sortable timestamps

Convert the submit instant to a Sheets serial datetime rendered against
`Europe/London`, and give columns A and I a `dd-mm-yyyy hh:mm` number format.
Extend `toCellData` (or add a sibling for datetime cells) and widen the
`appendCells` `fields` mask to cover `userEnteredFormat`.

Keep the conversion in one small helper in `lib/`, with the epoch offset and the
timezone handling explained, since a wrong offset here is invisible until
someone sorts the sheet.

**Done when:** a new row shows `27-08-2026 19:51` in columns A and I, sorting by
column A orders rows chronologically rather than by day of month, and the cells
report as datetimes rather than text.

### Step 3 - state retention and erasure on the privacy page

Replace the undecided-retention note at `app/privacy/page.tsx:15` and the wording
it feeds with the real policy: signups are deleted 18 months after the recorded
due month, or sooner on request. Keep the page's existing voice and the flat
theme; this is a copy change, not a redesign.

**Done when:** `/privacy` states the retention period and how to ask for
erasure, and the stale "still undecided" comment is gone.

### Step 4 - record the decisions in the plans

`blueprint/context/project-overview.md` is generated, so edit
`blueprint/project-plan.md`: add `signup_id` to the data model as column K, note
the timestamp format and timezone, record the retention period, and record the
duplicate decision with its reasoning. Remove the four resolved items from the
open questions. Then re-run `/overview`.

**Done when:** the plans carry all four decisions and a regenerated overview
reflects them.

## Verify

1. `npm run build`
2. Submit against a **test copy** of the sheet, not the live one, and confirm
   column K holds a UUID and columns A and I read `DD-MM-YYYY HH:mm`
3. Sort the sheet by column A and confirm chronological order
4. Break `GOOGLE_SHEETS_SPREADSHEET_ID` and confirm the failure log carries the
   id and still no personal data
5. Read `/privacy` and confirm the retention wording

## Manual step outside the code

**Column K needs its header cell added by hand**, the same as column J did.
Add `signup_id` to the header row before the first real signup lands, or the
column will hold values under a blank heading.

## Verification record

| Done-when | Proof |
| --- | --- |
| `signup_id` in column K | Row returned 11 cells with a uuid at index 10; failure log carried the same id with no personal data |
| Timestamps readable and sortable | Six cases through `toSheetDateTime`, decoded as Sheets would: BST, GMT, midnight rollover, and both sides of the spring-forward transition |
| Sheets accepts the format | Real write to a test copy returned `formattedValue` `27-08-2026 12:30`, `userEnteredValue` `numberValue`, `effectiveFormat.numberFormat` `DATE_TIME dd-mm-yyyy hh:mm` |
| Narrow `fields` mask is safe | Columns B-H, J and K reported no number format after the write, so nothing else was reset |
| Retention stated | `/privacy` renders the eighteen-month wording |
| Build | `npm run build` compiled and type-checked clean |

Sheet headers applied to both the test copy and the live sheet: `signup_id` written
to `Signups!K1`, one cell per sheet, no signup data touched.

Carried forward, not resolved by this fix:

- Retention is stated on `/privacy` but nothing deletes on a schedule. The sweep
  is manual, so the page currently promises what only a person can deliver.
- The 15 rows written before this change hold ISO text in columns A and I, so
  those columns mix text and datetimes and sort in two blocks.
- Column J's header reads `location` by decision, recorded in the plans so it is
  not later "corrected" to match the field name.
