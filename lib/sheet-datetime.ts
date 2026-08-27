// Google Sheets stores a datetime as a number: whole days since 1899-12-30,
// with the time as the fraction. Writing one of these instead of a formatted
// string is what keeps the column sortable. Text in dd-mm-yyyy sorts by day of
// month, so 01-09 would order before 27-08 and every sort, filter and chart
// built on the sheet would be quietly wrong.
const SHEETS_EPOCH_UTC = Date.UTC(1899, 11, 30);
const MS_PER_DAY = 86_400_000;

// What the team reads in the cell. Sheets' own pattern language, not a JS one.
const FORMATS = {
  datetime: { type: "DATE_TIME", pattern: "dd-mm-yyyy hh:mm" },
  date: { type: "DATE", pattern: "dd-mm-yyyy" },
  time: { type: "TIME", pattern: "hh:mm" },
} as const;

// Marks a cell that must reach the sheet as a real date, time or datetime
// rather than text. The value carries its own number format so toCellData never
// has to know which column indexes hold what.
export interface SheetDateTime {
  readonly kind: "datetime";
  readonly serial: number;
  readonly format: { readonly type: string; readonly pattern: string };
}

export function isSheetDateTime(value: unknown): value is SheetDateTime {
  return typeof value === "object" && value !== null && "kind" in value
    && (value as SheetDateTime).kind === "datetime";
}

// The instant is rendered against a UK wall clock rather than UTC, because the
// team reads these times expecting UK local time and a UTC value would show
// every summer signup an hour early. Intl carries the BST/GMT rules, so the
// switch is never handled by hand here.
//
// hourCycle h23 matters: en-GB with hour12 false reports midnight as hour 24,
// which would push the serial a full day forward.
//
// One reading of the London wall clock, shared by all three builders. Deriving
// the date and the time from separate readings would let a signup at 23:58 take
// its date, tick past midnight, and take its time from the next day, leaving
// two columns permanently disagreeing about when it happened.
function londonSerial(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);

  const at_ = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  // Built through Date.UTC so the London wall-clock reading is treated as the
  // literal number to encode, with no second timezone shift applied to it.
  const wallClock = Date.UTC(
    at_("year"),
    at_("month") - 1,
    at_("day"),
    at_("hour"),
    at_("minute"),
    at_("second"),
  );

  return (wallClock - SHEETS_EPOCH_UTC) / MS_PER_DAY;
}

export function toSheetDateTime(at: Date): SheetDateTime {
  return { kind: "datetime", serial: londonSerial(at), format: FORMATS.datetime };
}

// A Sheets date is the whole part of the serial and a time is the fraction, so
// both come off the same number rather than being formatted independently.
export function toSheetDate(at: Date): SheetDateTime {
  return {
    kind: "datetime",
    serial: Math.floor(londonSerial(at)),
    format: FORMATS.date,
  };
}

export function toSheetTime(at: Date): SheetDateTime {
  const serial = londonSerial(at);
  return {
    kind: "datetime",
    serial: serial - Math.floor(serial),
    format: FORMATS.time,
  };
}
