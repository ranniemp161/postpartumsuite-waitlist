import type { WaitlistField, WaitlistFieldErrors } from "@/lib/waitlist-schema";

export function errorId(field: WaitlistField): string {
  return `${field}_error`;
}

// Always rendered, even with nothing to say. A live region has to exist before
// the text arrives, or a screen reader has no region to announce into; `:empty`
// keeps the silent ones out of the layout.
export function FieldError({
  field,
  errors,
}: {
  field: WaitlistField;
  errors: WaitlistFieldErrors;
}) {
  return (
    <p className="field-error" id={errorId(field)} aria-live="polite">
      {errors[field]}
    </p>
  );
}

// Colour is never the only signal: the message text is the signal, and these
// two attributes are what tie it to the control for a screen reader.
//
// hintId is for a field that carries standing help text as well as an error.
// Both ids go on aria-describedby, in reading order, so an error never costs
// the visitor the hint that explains what the field wants.
export function invalidProps(
  field: WaitlistField,
  errors: WaitlistFieldErrors,
  hintId?: string,
): { "aria-invalid"?: true; "aria-describedby"?: string } {
  const describedBy = [hintId, errors[field] ? errorId(field) : null]
    .filter(Boolean)
    .join(" ");

  return {
    ...(errors[field] ? { "aria-invalid": true as const } : {}),
    ...(describedBy ? { "aria-describedby": describedBy } : {}),
  };
}

// For a <fieldset>, which maps to role="group". aria-invalid is not defined on
// a group, so the description hangs on the set and the invalid state goes on
// each radio inside it.
export function describedByProps(
  field: WaitlistField,
  errors: WaitlistFieldErrors,
) {
  if (!errors[field]) return {};
  return { "aria-describedby": errorId(field) } as const;
}
