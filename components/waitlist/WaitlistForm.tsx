import { Fragment } from "react";

import { DueMonthPicker } from "@/components/waitlist/DueMonthPicker";
import {
  DEFAULT_DIAL_CODE,
  DIAL_CODES,
  PARITY_OPTIONS,
} from "@/lib/waitlist-options";

export function WaitlistForm() {
  return (
    <form className="form-stack">
      {/* The mockup shows one NAME field; splitting it is an approved deviation
          so the confirmation panel can echo a first name. Fixed two columns:
          narrow-screen stacking is feature 7. */}
      <div className="grid grid-cols-2 gap-[10px]">
        <label className="field" htmlFor="first_name">
          <span className="field-label">First name</span>
          <input
            className="well"
            type="text"
            id="first_name"
            name="first_name"
            placeholder="Your first name"
          />
        </label>

        <label className="field" htmlFor="last_name">
          <span className="field-label">Last name</span>
          <input
            className="well"
            type="text"
            id="last_name"
            name="last_name"
            placeholder="Your last name"
          />
        </label>
      </div>

      <label className="field" htmlFor="email">
        <span className="field-label">Email</span>
        <input
          className="well"
          type="email"
          id="email"
          name="email"
          placeholder="you@example.com"
        />
      </label>

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
          />
        </div>
      </div>

      <DueMonthPicker />

      {/* Native radios, so arrow-key roving and the one-Tab-stop behaviour come
          from the browser rather than from state. The selected look is the
          :checked sibling; nothing here is interactive JavaScript. */}
      <fieldset className="parity-set">
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
      </fieldset>

      {/* The link sits outside the <label> on purpose. A link inside a label
          toggles the control the label owns, so clicking "privacy policy" would
          tick the box on the way out. Stopping that any other way needs a client
          component, and this feature has none. */}
      <div className="consent-row">
        <input type="checkbox" id="consent" name="consent" />
        <span>
          <label htmlFor="consent">
            I agree to receive updates and accept the
          </label>{" "}
          <a href="/privacy">privacy policy</a>.
        </span>
      </div>

      {/* type="button" only until feature 4 adds the server action, which flips
          this to type="submit". The form has no action yet, so a submit would
          navigate with the visitor's name, email and phone in the query string. */}
      <button type="button" className="btn-inlay">
        <span>Join our wait list</span>
      </button>
    </form>
  );
}
