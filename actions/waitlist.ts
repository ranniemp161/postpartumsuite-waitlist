"use server";

import { saveSignup } from "@/lib/sheets";
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

    await saveSignup(signup);

    return {
      status: "success",
      firstName: signup.first_name,
      email: signup.email,
    };
  } catch (error) {
    // The visitor gets FAILURE_MESSAGE; the detail stays in the server log.
    console.error("waitlist submit failed", error);
    return { status: "failed", message: FAILURE_MESSAGE };
  }
}
