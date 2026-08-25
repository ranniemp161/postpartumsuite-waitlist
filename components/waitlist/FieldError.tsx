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
export function invalidProps(field: WaitlistField, errors: WaitlistFieldErrors) {
  if (!errors[field]) return {};
  return { "aria-invalid": true, "aria-describedby": errorId(field) } as const;
}
