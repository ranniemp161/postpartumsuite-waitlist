import { z } from "zod";

import { isPastMonth } from "@/lib/due-month";
import { E164_PATTERN, nationalDigits, toE164 } from "@/lib/phone";
import { DIAL_CODES, PARITY_OPTIONS, type Parity } from "@/lib/waitlist-options";

// Keyed on the form's `name` attributes, not on the output keys, so an error
// can point at the control the visitor can actually see: `phone_national`
// rather than `phone`.
export const WAITLIST_FIELDS = [
  "first_name",
  "last_name",
  "email",
  "dial_code",
  "phone_national",
  "due_month",
  "parity",
  "consent",
] as const;

export type WaitlistField = (typeof WAITLIST_FIELDS)[number];
export type WaitlistFieldErrors = Partial<Record<WaitlistField, string>>;

const PARITY_VALUES: readonly number[] = PARITY_OPTIONS.map(
  (option) => option.value,
);

function requiredName(label: string) {
  return z
    .string()
    .trim()
    .min(1, { error: `Enter your ${label}` })
    .max(60, { error: `Your ${label} is too long` });
}

const waitlistFormSchema = z
  .object({
    first_name: requiredName("first name"),
    last_name: requiredName("last name"),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, { error: "Enter your email address" })
      .pipe(z.email({ error: "Enter a valid email address" })),

    dial_code: z.string().refine(
      (value) => DIAL_CODES.some((dial) => dial.code === value),
      { error: "Choose a dial code" },
    ),

    // Zod skips an object-level check while any field is still failing, so a
    // number the visitor can see is wrong is judged here rather than only in
    // the cross-field E.164 guard below. Otherwise a bad number stays hidden
    // until every other error is fixed, which is one resubmit too many.
    phone_national: z
      .string()
      .trim()
      .min(1, { error: "Enter your phone number" })
      .refine(
        (value) => {
          const digits = nationalDigits(value);
          return digits.length >= 7 && digits.length <= 14;
        },
        { error: "Enter a valid phone number" },
      ),

    // Empty and malformed share a message because the picker is the only thing
    // that writes this field, so a malformed value means the markup is broken,
    // not the visitor.
    due_month: z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/, { error: "Choose your due date" })
      .refine(
        (value) => {
          const [year, month] = value.split("-").map(Number);
          return !isPastMonth(year, month - 1, new Date());
        },
        { error: "Choose a due date that is not in the past" },
      ),

    // Number("") is 0, so an unanswered group fails here rather than needing a
    // separate empty check.
    parity: z
      .string()
      .transform(Number)
      .refine((value) => PARITY_VALUES.includes(value), {
        error: "Tell us if this is your first baby",
      })
      .transform((value) => value as Parity),

    // The browser sends "on" for a ticked box and nothing at all for an
    // unticked one, which `parseWaitlistForm` turns into "".
    consent: z
      .literal("on", {
        error: "You need to accept the privacy policy to join",
      })
      .transform(() => true as const),
  })
  .superRefine((values, ctx) => {
    if (E164_PATTERN.test(toE164(values.dial_code, values.phone_national))) {
      return;
    }
    ctx.addIssue({
      code: "custom",
      path: ["phone_national"],
      message: "Enter a valid phone number",
    });
  });

// The sheet's contract. Feature 5 appends exactly these values; `created_at`
// and `consent_at` are stamped inside saveSignup(), so one module owns the clock.
export const waitlistSignupSchema = waitlistFormSchema.transform((values) => ({
  first_name: values.first_name,
  last_name: values.last_name,
  email: values.email,
  phone: toE164(values.dial_code, values.phone_national),
  due_month: values.due_month,
  parity: values.parity,
  consent: values.consent,
}));

export type WaitlistSignupInput = z.output<typeof waitlistSignupSchema>;

export function parseWaitlistForm(formData: FormData) {
  const raw = Object.fromEntries(
    WAITLIST_FIELDS.map((field) => [field, String(formData.get(field) ?? "")]),
  );
  return waitlistSignupSchema.safeParse(raw);
}

// One message per field: the form shows a single line under each control, and
// the first issue is the one worth reading. Read off `issues` rather than
// flattenError, whose key type follows the schema's output and so cannot name
// the two phone controls the visitor actually sees.
export function toFieldErrors<T>(error: z.ZodError<T>): WaitlistFieldErrors {
  const result: WaitlistFieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (!isWaitlistField(field) || result[field]) continue;
    result[field] = issue.message;
  }
  return result;
}

export function isWaitlistField(value: unknown): value is WaitlistField {
  return WAITLIST_FIELDS.includes(value as WaitlistField);
}
