"use client";

import {
  Fragment,
  startTransition,
  useActionState,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { joinWaitlist } from "@/actions/waitlist";
import { ConfirmationPanel } from "@/components/waitlist/ConfirmationPanel";
import { DueMonthPicker } from "@/components/waitlist/DueMonthPicker";
import {
  describedByProps,
  FieldError,
  invalidProps,
} from "@/components/waitlist/FieldError";
import {
  HONEYPOT_FIELD,
  UK_DIAL_CODE,
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
const POSTCODE_HINT_ID = "postcode_outward_hint";
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

  // React owns the reset of any form it drives through the action prop, and it
  // empties every uncontrolled field once the action answers. That is right for
  // a form that succeeded and wrong for one that came back with errors: a
  // visitor who missed the consent box would have to retype their name, email
  // and number. Dispatching the same action by hand keeps the reset out of
  // React's hands, so the DOM values stay exactly where the visitor left them.
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => submit(data));
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
        onSubmit={onSubmit}
        className="form-stack"
        onChange={onFieldEdit}
        onBlur={onFieldEdit}
      >
        {/* Off-screen rather than sr-only: sr-only keeps a control in the
            accessibility tree, and a screen reader announcing a stray "website"
            field is exactly the harm this is meant to avoid. aria-hidden and
            tabIndex -1 keep it off both the reading order and the tab order,
            and autoComplete="off" is what stops a browser filling it and
            discarding a real signup. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <input
            type="text"
            name={HONEYPOT_FIELD}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {/* The mockup shows one NAME field; splitting it is an approved deviation
            so the confirmation panel can echo a first name. One column under
            640px, because two 122px wells would each hold about eight
            characters. */}
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
            {/* Not a control. With one country there is nothing to choose, so
                the prefix is stated and the value rides on a hidden input.
                aria-hidden because the label already says "Phone number" and
                the prefix is not part of the answer she gives. */}
            <span className="phone-prefix" aria-hidden="true">
              UK +44
            </span>
            <input type="hidden" name="dial_code" value={UK_DIAL_CODE} />

            <input
              className="well"
              type="tel"
              id="phone_national"
              name="phone_national"
              placeholder="07700 900123"
              {...invalidProps("phone_national", errors)}
            />
          </div>

          {/* The dial code is fixed, so its slot only ever fills if the posted
              value was tampered with. Rendering it anyway is what stops that
              becoming a button that silently does nothing. */}
          <FieldError field="dial_code" errors={errors} />
          <FieldError field="phone_national" errors={errors} />
        </div>

        {/* Sits with the contact details rather than the pregnancy questions:
            it answers where she is, not anything about the birth. Only the
            outward code is asked for and only the outward code is stored, which
            is the promise the privacy policy has to keep. */}
        <div className="field">
          <div className="label-group">
            <label className="field-label" htmlFor="postcode_outward">
              Your area
            </label>
            <p className="field-hint" id={POSTCODE_HINT_ID}>
              First part of your postcode, for example SW7
            </p>
          </div>

          {/* uppercase is display only; the value posts as typed and the server
              normalises it, so a visitor pasting a full postcode in lower case
              still lands on the right outward code. */}
          <input
            className="well uppercase"
            type="text"
            id="postcode_outward"
            name="postcode_outward"
            inputMode="text"
            autoComplete="postal-code"
            maxLength={8}
            placeholder="SW7"
            {...invalidProps("postcode_outward", errors, POSTCODE_HINT_ID)}
          />
          <FieldError field="postcode_outward" errors={errors} />
        </div>

        <DueMonthPicker
          errors={errors}
          onPick={(dueMonth) => revalidate("due_month", dueMonth)}
        />

        {/* Native radios, so arrow-key roving and the one-Tab-stop behaviour come
            from the browser rather than from state. The selected look is the
            :checked sibling; nothing here is interactive JavaScript. */}
        <fieldset
          className="parity-set"
          {...describedByProps("parity", errors)}
        >
          <legend className="field-label">Which baby are you expecting?</legend>

          <div className="parity-row">
            {PARITY_OPTIONS.map(({ value, label }) => (
              <Fragment key={value}>
                <input
                  className="sr-only"
                  type="radio"
                  id={`parity_${value}`}
                  name="parity"
                  value={value}
                  {...invalidProps("parity", errors)}
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
        <button type="submit" className="btn-primary" disabled={pending}>
          <span>{pending ? "Joining..." : "Join waitlist"}</span>
        </button>
      </form>
    </>
  );
}
