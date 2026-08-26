"use client";

import { useEffect, useRef, useState } from "react";

import { FieldError, invalidProps } from "@/components/waitlist/FieldError";
import {
  MONTH_LABELS,
  earliestDueYear,
  formatDueMonth,
  isPastMonth,
  toDueMonth,
} from "@/lib/due-month";
import type { WaitlistFieldErrors } from "@/lib/waitlist-schema";

type SelectedMonth = { year: number; monthIndex: number };

// Null is closed, and the popover does not render at all while it is. That is
// what keeps the clock off the server pass: `today` is read when the visitor
// opens the panel, so no server-rendered markup can disagree with the browser
// about which months are past.
type Calendar = { today: Date; viewYear: number; activeIndex: number };

const COLUMNS = 3;

export function DueMonthPicker({
  errors,
  onPick,
}: {
  errors: WaitlistFieldErrors;
  onPick: (dueMonth: string) => void;
}) {
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [selected, setSelected] = useState<SelectedMonth | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Only an open moves focus into the grid. Reacting to `calendar` alone would
  // also yank focus off the year arrows the moment they were used.
  const focusOnOpen = useRef(false);

  useEffect(() => {
    if (!calendar || !focusOnOpen.current) return;
    focusOnOpen.current = false;
    monthButtons(gridRef.current)[calendar.activeIndex]?.focus({
      preventScroll: true,
    });
  }, [calendar]);

  function open() {
    const today = new Date();
    const viewYear = selected?.year ?? today.getFullYear();

    focusOnOpen.current = true;
    setCalendar({
      today,
      viewYear,
      activeIndex: firstReachable(viewYear, today, selected),
    });
  }

  function close({ restoreFocus }: { restoreFocus: boolean }) {
    setCalendar(null);
    if (restoreFocus) triggerRef.current?.focus({ preventScroll: true });
  }

  function stepYear(delta: number) {
    setCalendar((current) => {
      if (!current) return current;
      const viewYear = current.viewYear + delta;
      return {
        ...current,
        viewYear,
        activeIndex: firstReachable(viewYear, current.today, selected),
      };
    });
  }

  function pick(monthIndex: number) {
    if (!calendar) return;
    setSelected({ year: calendar.viewYear, monthIndex });
    close({ restoreFocus: true });
    // The hidden input is React-controlled, so setting it fires no change event
    // the form could hear. The new value goes out by hand instead.
    onPick(toDueMonth(calendar.viewYear, monthIndex));
  }

  // Roving tabindex: the grid is one tab stop and the arrows move within it,
  // skipping past months so keyboard focus can never land somewhere unpickable.
  function onGridKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!calendar) return;

    const buttons = monthButtons(gridRef.current);
    const target = moveTarget(event.key, calendar.activeIndex, buttons);
    if (target === null) return;

    event.preventDefault();
    setCalendar({ ...calendar, activeIndex: target });
    buttons[target]?.focus({ preventScroll: true });
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape" || !calendar) return;
    event.preventDefault();
    close({ restoreFocus: true });
  }

  // Tabbing past the grid would otherwise leave an orphan panel open over the
  // fields below it.
  function onBlur(event: React.FocusEvent<HTMLDivElement>) {
    if (!calendar) return;

    // WebKit does not focus a <button> when it is tapped, so on iOS every tap
    // inside the panel blurs the grid with relatedTarget null. Reading that as
    // "focus left the field" closed the popover before the arrow's click could
    // fire, which is why the year appeared not to advance on iPhone while
    // working on Android. Focus going nowhere is not a reason to close: a real
    // tap outside is already handled by the pointerdown listener below.
    const next = event.relatedTarget;
    if (!next) return;

    if (event.currentTarget.contains(next)) return;
    close({ restoreFocus: false });
  }

  useEffect(() => {
    if (!calendar) return;

    function onPointerDown(event: PointerEvent) {
      if (fieldRef.current?.contains(event.target as Node)) return;
      setCalendar(null);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [calendar]);

  return (
    <div
      ref={fieldRef}
      className="field date-field"
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    >
      <label className="field-label" htmlFor="due_month_trigger">
        Birth due date
      </label>

      {/* The value the schema validates and feature 5 writes to the sheet.
          Empty until a month is picked, which the schema rejects. */}
      <input
        type="hidden"
        name="due_month"
        value={selected ? toDueMonth(selected.year, selected.monthIndex) : ""}
      />

      {/* A button is a labelable element, so the label associates for real
          rather than through aria. type="button" matters: a bare button inside
          a form submits it. */}
      <button
        ref={triggerRef}
        type="button"
        id="due_month_trigger"
        className="well flex items-center justify-between text-left"
        aria-haspopup="dialog"
        aria-expanded={calendar !== null}
        {...invalidProps("due_month", errors)}
        onClick={() => (calendar ? close({ restoreFocus: false }) : open())}
      >
        {/* A button has no ::placeholder to inherit, so the empty state borrows
            the placeholder tone by class instead. MM / YYYY rather than the
            mockup's DD / MM / YYYY, because a due date is an estimate and the
            schema stores a month. */}
        <span className={selected ? "text-ink" : "text-placeholder"}>
          {selected
            ? formatDueMonth(selected.year, selected.monthIndex)
            : "MM / YYYY"}
        </span>

        {/* Stroke matches --color-ink-soft, sampled off Homepage.png; the
            placeholder beside it is a step lighter at --color-placeholder. */}
        <svg
          className="text-ink-soft shrink-0"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <rect x="1.6" y="3" width="12.8" height="11" rx="1.4" />
          <path d="M1.6 6.3h12.8M5.2 1.6v2.9M10.8 1.6v2.9" />
        </svg>
      </button>

      <FieldError field="due_month" errors={errors} />

      {calendar && (
        <div
          className="cal-popover"
          role="dialog"
          aria-label="Choose your due month"
        >
          <YearStepper calendar={calendar} onStep={stepYear} />

          <div className="cal-grid" onKeyDown={onGridKeyDown} ref={gridRef}>
            {MONTH_LABELS.map((label, index) => (
              <button
                key={label}
                type="button"
                className="cal-month"
                tabIndex={index === calendar.activeIndex ? 0 : -1}
                disabled={isPastMonth(calendar.viewYear, index, calendar.today)}
                aria-pressed={
                  selected?.year === calendar.viewYear &&
                  selected.monthIndex === index
                }
                onClick={() => pick(index)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* Only the back arrow can be out of range, and it is disabled rather than
   removed so the row keeps its width and the year label stays centred. There is
   no forward limit: the grid disables past months on its own, so nothing the
   stepper reaches can produce an invalid pick. */
function YearStepper({
  calendar,
  onStep,
}: {
  calendar: Calendar;
  onStep: (delta: number) => void;
}) {
  const minYear = earliestDueYear(calendar.today);

  return (
    <div className="cal-head">
      <button
        type="button"
        className="cal-step"
        aria-label="Previous year"
        disabled={calendar.viewYear <= minYear}
        onClick={() => onStep(-1)}
      >
        <CalArrow direction="left" />
      </button>

      <span className="cal-year">{calendar.viewYear}</span>

      <button
        type="button"
        className="cal-step"
        aria-label="Next year"
        onClick={() => onStep(1)}
      >
        <CalArrow direction="right" />
      </button>
    </div>
  );
}

function CalArrow({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path
        d={
          direction === "left"
            ? "M8.6 3.2 4.8 7l3.8 3.8"
            : "M5.4 3.2 9.2 7l-3.8 3.8"
        }
      />
    </svg>
  );
}

function monthButtons(grid: HTMLDivElement | null): HTMLButtonElement[] {
  return grid ? Array.from(grid.querySelectorAll("button")) : [];
}

// Where the grid tab stop sits when a year is drawn: the chosen month if it is
// on this year, otherwise the first month still available.
function firstReachable(
  viewYear: number,
  today: Date,
  selected: SelectedMonth | null,
): number {
  if (selected?.year === viewYear) return selected.monthIndex;
  return MONTH_LABELS.findIndex(
    (_, index) => !isPastMonth(viewYear, index, today),
  );
}

// Arrow steps skip over disabled months and stop at the ends rather than
// wrapping, so a past month can never take focus.
function moveTarget(
  key: string,
  from: number,
  buttons: HTMLButtonElement[],
): number | null {
  if (key === "Home" || key === "End") {
    const enabled = buttons
      .map((button, index) => (button.disabled ? null : index))
      .filter((index): index is number => index !== null);
    const target = key === "Home" ? enabled.at(0) : enabled.at(-1);
    return target ?? null;
  }

  const deltas: Record<string, number> = {
    ArrowRight: 1,
    ArrowLeft: -1,
    ArrowDown: COLUMNS,
    ArrowUp: -COLUMNS,
  };
  const delta = deltas[key];
  if (delta === undefined) return null;

  for (
    let next = from + delta;
    next >= 0 && next < buttons.length;
    next += delta
  ) {
    if (!buttons[next].disabled) return next;
  }
  return null;
}
