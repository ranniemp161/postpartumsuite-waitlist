import type { WaitlistFieldErrors } from "@/lib/waitlist-schema";

// A discriminated union rather than the standards' { success, data, error },
// because useActionState carries one value and that value has to hold per-field
// messages. `failed` is the server breaking; `invalid` is the visitor.
export type WaitlistFormState =
  | { status: "idle" }
  | { status: "invalid"; fieldErrors: WaitlistFieldErrors }
  | { status: "failed"; message: string }
  | { status: "success"; firstName: string };
