"use server";

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

    // feature 5: saveSignup(result.data) lands here. Until it does this action
    // validates and discards, so the page must not be deployed in that window.
    const signup = result.data;

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
