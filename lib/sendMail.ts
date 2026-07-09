import type { ActionState } from "@/actions/types";

// The contact form's validated values (see components/forms/ContactForm.tsx).
type ContactFormData = {
  name: string;
  email: string;
  message: string;
};

export async function sendEmail(data: ContactFormData): Promise<ActionState> {
    const apiEndpoint = '/api/email';
    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        const responseData = await response.json();
        return { message: "Your message sent successfully !" }
    } catch (err) {
        console.log(err);
        return { message: "Something went wrong !" }
    }
}
