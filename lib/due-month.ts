// The whole month vocabulary of the picker. Kept pure and free of `new Date()`
// so "today" enters as an argument: the popover reads the clock once, on the
// client, and nothing here can disagree with it across a midnight or a timezone.

// Grid faces. The record is always the index, never the label.
export const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

// The `YYYY-MM` contract the sheet column and feature 4's schema both depend on.
// 0-based in, 1-based and zero-padded out.
export function toDueMonth(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

// The trigger face once a month is chosen.
export function formatDueMonth(year: number, monthIndex: number): string {
  return `${MONTH_NAMES[monthIndex]} ${year}`;
}

// Strictly earlier than today's month: the current month is still a due month.
export function isPastMonth(
  year: number,
  monthIndex: number,
  today: Date,
): boolean {
  const thisYear = today.getFullYear();
  return year < thisYear || (year === thisYear && monthIndex < today.getMonth());
}

// A pregnancy runs about nine months, so one year ahead covers anyone already
// expecting. Two is deliberate slack for someone planning rather than pregnant:
// the client would rather take an early signup than show her a dead end. It
// still stops the stepper wandering into 2043.
const MAX_YEARS_AHEAD = 2;

export function dueMonthYearBounds(today: Date): {
  minYear: number;
  maxYear: number;
} {
  const minYear = today.getFullYear();
  return { minYear, maxYear: minYear + MAX_YEARS_AHEAD };
}
