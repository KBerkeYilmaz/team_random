import type { ActionState } from "@/actions/types";

// The contact form's validated values (see components/forms/ContactForm.tsx).
type ContactFormData = {
  name: string;
  email: string;
  message: string;
};

export async function sendEmail(data: ContactFormData): Promise<ActionState> {
  const apiEndpoint = "/api/email";
  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
    // /api/email answers 200 `{ message }` on a successful send and
    // 500 `{ error }` when nodemailer rejects. Honour that status so a
    // failed send surfaces the destructive branch in ContactForm instead
    // of the previous behaviour, which returned `{ message }` regardless
    // and always showed a success-ish toast (issue #127).
    if (!response.ok) {
      // 503 = the Gmail integration is inert (APP_EMAIL/APP_PASSWORD unset;
      // see app/api/email/route.ts and issue #116). Give the visitor an
      // honest "temporarily unavailable" message rather than a generic error.
      if (response.status === 503) {
        return {
          error: "email-not-configured",
          message:
            "The contact form is temporarily unavailable. Please email us directly.",
        };
      }
      return {
        error: "send-failed",
        message: "Something went wrong !",
      };
    }
    return { message: "Your message sent successfully !" };
  } catch (err) {
    // Network / unexpected failure (fetch threw): also surface the error
    // branch so the user sees a destructive toast rather than a false success.
    console.log(err);
    return {
      error: "send-failed",
      message: "Something went wrong !",
    };
  }
}
