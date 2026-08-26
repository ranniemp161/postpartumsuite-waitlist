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

// The only bound is backwards. A forward ceiling was tried at one year and then
// two, and both read as the picker being broken rather than considerate: any
// finite limit is a wall somebody eventually hits. The client's call, on the
// grounds that a visitor who cannot enter her date does not sign up at all,
// where an odd far-future month is one row somebody can see and correct.
export function earliestDueYear(today: Date): number {
  return today.getFullYear();
}
