// @vitest-environment jsdom
//
// components/forms/ContactForm.test.tsx
// Phase 4b (issue #153): the suite's ONE React Testing Library smoke test. Its
// job is not to re-verify contactSchema (actions/schemas.test.ts already does
// that as pure logic) but to prove the component-testing harness works
// end-to-end — that a real form mounts in jsdom and that Zod messages surface as
// DOM text through the shadcn <Form>/<FormMessage> plumbing. This establishes the
// pattern the heavier 4c flows build on.
//
// The `// @vitest-environment jsdom` docblock on the first line opts this single
// file into jsdom (the suite default is the faster node env). `afterEach(cleanup)`
// is explicit because auto-cleanup is off while `globals: false`.
//
// ContactForm was chosen deliberately: it needs zero mocks and zero providers. A
// submit with empty fields fails client validation, so `onSubmit` (and its
// sendEmail fetch) never runs — nothing to stub.

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import ContactForm from "@/components/forms/ContactForm";

afterEach(cleanup);

describe("ContactForm", () => {
  it("renders the heading and the submit button", () => {
    render(<ContactForm />);

    expect(
      screen.getByRole("heading", { name: /send us an email/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
  });

  it("surfaces the three Zod validation messages on an empty submit", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.click(screen.getByRole("button", { name: /submit/i }));

    // findByText awaits react-hook-form's async validation → DOM update.
    expect(
      await screen.findByText("Name must be at least 3 characters."),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Please enter a valid email."),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Message must be at least 3 characters."),
    ).toBeInTheDocument();
  });
});
