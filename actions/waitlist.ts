"use server";

import { saveSignup } from "@/lib/sheets";
import { HONEYPOT_FIELD } from "@/lib/waitlist-options";
import { parseWaitlistForm, toFieldErrors } from "@/lib/waitlist-schema";
import type { WaitlistFormState } from "@/types/waitlist";

const FAILURE_MESSAGE =
  "Something went wrong at our end and your details were not sent. Please try again.";

export async function joinWaitlist(
  _previous: WaitlistFormState,
  formData: FormData,
): Promise<WaitlistFormState> {
  try {
    const result = parseWaitlistForm(formData);

    if (!result.success) {
      return { status: "invalid", fieldErrors: toFieldErrors(result.error) };
    }

    const signup = result.data;

    // Checked after validation, not before, so the answer a bot gets is the
    // same shape as the one a visitor gets and reveals nothing about why. The
    // discard is silent for the same reason: a bot told it was caught is a bot
    // that tries again without the decoy.
    //
    // The cost of that silence is a false positive discarding a real signup
    // with no trace the visitor would notice, so it leaves one here. No field
    // values: a submission reaching this branch is still someone's data.
    if (String(formData.get(HONEYPOT_FIELD) ?? "").trim()) {
      console.warn("WAITLIST_SIGNUP_DISCARDED", JSON.stringify({ reason: "honeypot" }));
      return { status: "success", firstName: signup.first_name };
    }

    await saveSignup(signup);

    return { status: "success", firstName: signup.first_name };
  } catch (error) {
    // The visitor gets FAILURE_MESSAGE; the detail stays in the server log.
    console.error("waitlist submit failed", error);
    return { status: "failed", message: FAILURE_MESSAGE };
  }
}
