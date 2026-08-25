"use client";

import { Fragment, useActionState, useRef, useState, type ReactNode } from "react";

import { joinWaitlist } from "@/actions/waitlist";
import { ConfirmationPanel } from "@/components/waitlist/ConfirmationPanel";
import { DueMonthPicker } from "@/components/waitlist/DueMonthPicker";
import { FieldError, invalidProps } from "@/components/waitlist/FieldError";
import {
  DEFAULT_DIAL_CODE,
  DIAL_CODES,
  PARITY_OPTIONS,
} from "@/lib/waitlist-options";
import {
  isWaitlistField,
  parseWaitlistForm,
  toFieldErrors,
  type WaitlistField,
  type WaitlistFieldErrors,
} from "@/lib/waitlist-schema";
import type { WaitlistFormState } from "@/types/waitlist";

const INITIAL_STATE: WaitlistFormState = { status: "idle" };
const NO_ERRORS: WaitlistFieldErrors = {};

export function WaitlistForm({ intro }: { intro?: ReactNode }) {
  const [state, submit, pending] = useActionState(joinWaitlist, INITIAL_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  // Corrections made since the server last answered. Tagging them with the
  // state object they were made against is what retires them: a new answer is
  // a new object, so stale corrections cannot outlive the response they edited.
  const [live, setLive] = useState<{
    answer: WaitlistFormState;
    errors: WaitlistFieldErrors;
  } | null>(null);

  const serverErrors =
    state.status === "invalid" ? state.fieldErrors : NO_ERRORS;

  const errors = live?.answer === state ? live.errors : serverErrors;

  // Silent until the server has rejected something once. Before that a
  // half-typed email is just a half-typed email.
  function revalidate(field: WaitlistField, override?: string) {
    const form = formRef.current;
    if (!form || state.status !== "invalid") return;

    const data = new FormData(form);
    if (override !== undefined) data.set(field, override);

    const result = parseWaitlistForm(data);
    const fresh = result.success ? {} : toFieldErrors(result.error);

    // Only the field the visitor touched moves. Re-reading the whole form is
    // how the one schema stays the only definition of valid, but the other
    // fields keep whatever the server said about them.
    setLive({ answer: state, errors: { ...errors, [field]: fresh[field] } });
  }

  function onFieldEdit(event: React.SyntheticEvent<HTMLFormElement>) {
    const { name } = event.target as HTMLInputElement;
    if (isWaitlistField(name)) revalidate(name);
  }

  // In place, with no navigation: the visitor keeps the logo and heading above.
  // `intro` is the standing copy and its rules, which belong to the form rather
  // than to the thank you, so both leave together.
  if (state.status === "success") {
    return <ConfirmationPanel firstName={state.firstName} />;
  }

  return (
    <>
      {intro}

      <form
        ref={formRef}
        action={submit}
        className="form-stack"
        onChange={onFieldEdit}
        onBlur={onFieldEdit}
      >
        {/* The mockup shows one NAME field; splitting it is an approved deviation
            so the confirmation panel can echo a first name. Fixed two columns:
            narrow-screen stacking is feature 7. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px]">
          {/* The label wraps nothing now: an error paragraph inside a <label>
              becomes part of the control's accessible name, so the message has to
              be a sibling and the association goes through htmlFor. */}
          <div className="field">
            <label className="field-label" htmlFor="first_name">
              First name
            </label>
            <input
              className="well"
              type="text"
              id="first_name"
              name="first_name"
              placeholder="Your first name"
              {...invalidProps("first_name", errors)}
            />
            <FieldError field="first_name" errors={errors} />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="last_name">
              Last name
            </label>
            <input
              className="well"
              type="text"
              id="last_name"
              name="last_name"
              placeholder="Your last name"
              {...invalidProps("last_name", errors)}
            />
            <FieldError field="last_name" errors={errors} />
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input
            className="well"
            type="email"
            id="email"
            name="email"
            placeholder="you@example.com"
            {...invalidProps("email", errors)}
          />
          <FieldError field="email" errors={errors} />
        </div>

        {/* Two controls under one label, so .field is a div here and the label is
            associated by id. The select carries its own name, since "Phone number"
            describes the number, not the country code. */}
        <div className="field">
          <label className="field-label" htmlFor="phone_national">
            Phone number
          </label>

          <div className="phone-row">
            <select
              className="well"
              id="dial_code"
              name="dial_code"
              defaultValue={DEFAULT_DIAL_CODE}
              aria-label="Dial code"
              {...invalidProps("dial_code", errors)}
            >
              {DIAL_CODES.map(({ code, label }) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>

            <input
              className="well"
              type="tel"
              id="phone_national"
              name="phone_national"
              placeholder="7700 900123"
              {...invalidProps("phone_national", errors)}
            />
          </div>

          {/* The select is constrained, so its slot only ever fills if the posted
              value was tampered with. Rendering it anyway is what stops that
              becoming a button that silently does nothing. */}
          <FieldError field="dial_code" errors={errors} />
          <FieldError field="phone_national" errors={errors} />
        </div>

        <DueMonthPicker
          errors={errors}
          onPick={(dueMonth) => revalidate("due_month", dueMonth)}
        />

        {/* Native radios, so arrow-key roving and the one-Tab-stop behaviour come
            from the browser rather than from state. The selected look is the
            :checked sibling; nothing here is interactive JavaScript. */}
        <fieldset className="parity-set" {...invalidProps("parity", errors)}>
          <legend className="field-label">Is this your first baby?</legend>

          <div className="parity-row">
            {PARITY_OPTIONS.map(({ value, label }) => (
              <Fragment key={value}>
                <input
                  className="sr-only"
                  type="radio"
                  id={`parity_${value}`}
                  name="parity"
                  value={value}
                />
                <label className="pill" htmlFor={`parity_${value}`}>
                  {label}
                </label>
              </Fragment>
            ))}
          </div>

          <FieldError field="parity" errors={errors} />
        </fieldset>

        <div className="field">
          {/* The link sits outside the <label> on purpose. A link inside a label
              toggles the control the label owns, so clicking "privacy policy"
              would tick the box on the way out. */}
          <div className="consent-row">
            <input
              type="checkbox"
              id="consent"
              name="consent"
              {...invalidProps("consent", errors)}
            />
            <span>
              <label htmlFor="consent">
                I agree to receive updates and accept the
              </label>{" "}
              <a href="/privacy">privacy policy</a>.
            </span>
          </div>

          <FieldError field="consent" errors={errors} />
        </div>

        {/* The server broke, not the visitor. role="alert" because this one is
            worth interrupting for: nothing was sent and the fix is to try again. */}
        {state.status === "failed" && (
          <p className="field-error" role="alert">
            {state.message}
          </p>
        )}

        {/* Disabling the button is what stops a double submit; the action itself
            is not idempotent, and feature 5 turns a second click into a second row. */}
        <button type="submit" className="btn-inlay" disabled={pending}>
          <span>{pending ? "Joining..." : "Join our wait list"}</span>
        </button>
      </form>
    </>
  );
}
