# Separate date and time into their own sheet columns

**Type:** Fix

## The problem

`created_at` holds a full datetime in column A, displayed `DD-MM-YYYY HH:mm`.
The team reads the sheet directly and wants the date and the time as separate
columns so each can be scanned, filtered and grouped on its own.

## The fix

Append `created_date` as column **L** and `created_time` as column **M**, both
written by the code as real Sheets values rather than text or formulas.

### Why not sheet formulas

`=INT(A2)` and `=A2-INT(A2)` in helper columns would need no code at all. Not
doing it: `appendCells` locates the end of the table by the last row of real
data, and an `ARRAYFORMULA` spilling down column L extends that. This module
already carries a comment about exactly this class of bug, where `values.append`
counted formatting as occupancy and pushed rows to the bottom of the grid while
still reporting success. Written values keep the append logic reading only what
the code put there.

### Why column A stays

A remains the full datetime and the canonical sortable value. L and M are for
reading, not for ordering. The same instant therefore appears in three columns,
which is accepted redundancy in a sheet whose whole purpose is being read by
people.

### Why `consent_at` is not split

`toSheetRow` stamps one instant into both `created_at` and `consent_at`, because
consent is given at submit and there is no earlier moment to record. Splitting
both would put one moment in five columns. If `consent_at` ever diverges from
`created_at`, revisit then.

### How Sheets represents each

A serial is days since 1899-12-30 with the time as the fraction, so:

- **date** is the whole part, `Math.floor(serial)`, formatted `DATE` / `dd-mm-yyyy`
- **time** is the fraction, `serial - Math.floor(serial)`, formatted `TIME` / `hh:mm`

Must not break: the fixed column order, column A's existing value and format, the
redacted failure log, or the honeypot.

## Build steps

Progress (survives a context clear):

- [x] Step 1 - let a sheet value carry its own number format
- [x] Step 2 - append `created_date` (L) and `created_time` (M)
- [x] Step 3 - add the header cells and record the change

### Step 1 - let a sheet value carry its own number format

`SheetDateTime` currently implies one format, applied in `toCellData` from a
module constant. Generalise it so the value carries its own
`{ type, pattern }`, then add `toSheetDate()` and `toSheetTime()` beside the
existing `toSheetDateTime()`.

All three must derive from the same London wall-clock reading, so a signup at
23:58 BST cannot land with one column on one date and another on the next.
Compute the serial once and derive the three values from it.

**Done when:** the three builders return the same underlying instant, a
date-only value has no fractional part, a time-only value is between 0 and 1,
and `npm run build` passes.

### Step 2 - append `created_date` (L) and `created_time` (M)

Extend `SheetRow` by two entries and populate them in `toSheetRow`. Append only;
never insert.

**Done when:** a written row has thirteen cells, L displays `27-08-2026` as a
`DATE`, and M displays `12:30` as a `TIME`, all three agreeing with column A.

### Step 3 - add the header cells and record the change

Write `created_date` to `Signups!L1` and `created_time` to `Signups!M1` on both
the test copy and the live sheet, one cell per write, touching no signup data.

Then record the two columns in `blueprint/project-plan.md` and
`blueprint/context/project-overview.md`, including the note that A, L and M
carry the same instant by design so nobody later removes the "duplicates".

**Done when:** both sheets show the headers, and the plans describe columns L
and M and why the redundancy is deliberate.

## Verify

1. `npm run build`
2. Write one row to the **test copy**, never the live sheet, and read it back:
   thirteen cells, L a `DATE`, M a `TIME`, both matching A
3. Confirm a late-evening instant puts L and M on the same date as A
4. Confirm existing rows are untouched

## Verification record

| Done-when | Proof |
| --- | --- |
| Builders agree | Four cases asserting the date is a whole serial, the time is between 0 and 1, and date + time reconstructs the datetime exactly |
| Midnight straddle safe | 23:58 and 00:01 London both kept L and M on the same day as A |
| Real write round-trip | Test copy: 13 cells, `L = '27-08-2026'` as `DATE dd-mm-yyyy`, `M = '13:07'` as `TIME hh:mm`, both agreeing with `A = '27-08-2026 13:07'` |
| Headers added | `Signups!L1:M1` written on the test copy and the live sheet, two cells each, no signup data addressed |
| Build | `npm run build` and `npm run lint` clean |

Carried forward, not resolved by this fix:

- The rows written before this change have empty L and M. Nothing backfills them.
- Column A's redundancy with L and M is deliberate and is recorded in the code,
  the plan and the overview, because deleting A would silently remove the only
  column that sorts chronologically.
- The test copy holds two probe rows, `Roundtrip Probe` and `Split Probe`.
