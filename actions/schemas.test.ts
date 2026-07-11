// actions/schemas.test.ts
// Phase 4b (issue #153): exercises every shared Zod schema in actions/schemas.ts.
// These schemas are the single source of truth for both the client forms
// (zodResolver) and the server actions (safeParse), so a regression here would
// silently change validation on both sides at once — exactly why they are tested
// as pure logic (zero mocks; the module imports only zod).
//
// Validation messages are asserted via `error.issues.map(i => i.message)` rather
// than `flatten().fieldErrors` — the flattened shape has an index signature that
// makes per-field access fight the type checker, while `issues` is a plain array
// of `{ message }`.
import { describe, expect, it } from "vitest";

import {
  contactSchema,
  editUserSchema,
  loginSchema,
  memberSchema,
  updateMemberSchema,
  updatePasswordSchema,
  workSchema,
} from "@/actions/schemas";

// Structural helper: accepts any schema's safeParse result and returns the flat
// list of error messages (empty when the parse succeeded). Typed structurally so
// it needs no `z.ZodError` import or generic wrangling.
function messagesOf(
  result:
    | { success: true }
    | { success: false; error: { issues: { message: string }[] } },
): string[] {
  return result.success ? [] : result.error.issues.map((i) => i.message);
}

describe("memberSchema", () => {
  it("accepts a valid member with the optional fields omitted", () => {
    const result = memberSchema.safeParse({
      memberName: "Alice",
      memberLastName: "Walker",
      memberTitle: "Engineer",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty strings and real URLs for the optional link fields", () => {
    const result = memberSchema.safeParse({
      memberName: "Alice",
      memberLastName: "Walker",
      memberTitle: "Engineer",
      memberPersonal: "",
      memberGithub: "https://github.com/alice",
      memberImage: "https://cdn.example.com/a.png",
    });
    expect(result.success).toBe(true);
  });

  it("reports the min-length message for each too-short required field", () => {
    const messages = messagesOf(
      memberSchema.safeParse({
        memberName: "Al",
        memberLastName: "W",
        memberTitle: "Eng",
      }),
    );
    expect(messages).toContain("Member name must be at least 3 characters.");
    expect(messages).toContain("Last name must be at least 3 characters.");
    // memberTitle "Eng" is exactly 3 → passes, so its message must be absent.
    expect(messages).not.toContain("Title must be at least 3 characters.");
  });

  it("rejects a malformed URL in a link field", () => {
    const result = memberSchema.safeParse({
      memberName: "Alice",
      memberLastName: "Walker",
      memberTitle: "Engineer",
      memberGithub: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateMemberSchema", () => {
  it("omits memberImage while memberSchema keeps it", () => {
    // updateMember edits the image separately, so the update variant drops it.
    expect(memberSchema.shape).toHaveProperty("memberImage");
    expect(updateMemberSchema.shape).not.toHaveProperty("memberImage");
  });

  it("still validates the shared required fields", () => {
    expect(
      updateMemberSchema.safeParse({
        memberName: "Alice",
        memberLastName: "Walker",
        memberTitle: "Engineer",
      }).success,
    ).toBe(true);
  });
});

describe("workSchema", () => {
  it("accepts a valid work with only the required fields", () => {
    const result = workSchema.safeParse({
      workTitle: "My",
      workReadme: "Hi",
      workTechStack: "TS",
    });
    expect(result.success).toBe(true);
  });

  it("reports the min-length message for each too-short required field", () => {
    const messages = messagesOf(
      workSchema.safeParse({
        workTitle: "M",
        workReadme: "H",
        workTechStack: "T",
      }),
    );
    expect(messages).toContain("Title must be at least 2 characters.");
    expect(messages).toContain("Readme must be at least 2 characters.");
    expect(messages).toContain("Tech Stack must be at least 2 characters.");
  });

  it("rejects a non-URL entry in workImages but accepts real URLs", () => {
    const base = { workTitle: "My", workReadme: "Hi", workTechStack: "TS" };
    expect(
      workSchema.safeParse({ ...base, workImages: ["not-a-url"] }).success,
    ).toBe(false);
    expect(
      workSchema.safeParse({ ...base, workImages: ["https://x.example.com"] })
        .success,
    ).toBe(true);
  });
});

describe("updatePasswordSchema", () => {
  const valid = {
    currentPassword: "current-8",
    newPassword: "brand-new-1",
    passwordConfirmation: "brand-new-1",
  };

  it("accepts three 8+ char fields with matching confirmation", () => {
    expect(updatePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("enforces the min(8) boundary on the current password", () => {
    // 7 chars → fails; the byte-identical 8-char case above → passes.
    const messages = messagesOf(
      updatePasswordSchema.safeParse({ ...valid, currentPassword: "seven-7" }),
    );
    expect(messages).toContain(
      "Current password must be at least 8 characters.",
    );
  });

  it("fails the .refine when confirmation does not match newPassword", () => {
    const messages = messagesOf(
      updatePasswordSchema.safeParse({
        ...valid,
        passwordConfirmation: "different-1",
      }),
    );
    expect(messages).toContain("Passwords don't match");
  });
});

describe("contactSchema", () => {
  it("accepts a valid contact submission", () => {
    expect(
      contactSchema.safeParse({
        name: "Alice",
        email: "alice@example.com",
        message: "Hello there",
      }).success,
    ).toBe(true);
  });

  it("reports each field's message on an invalid submission", () => {
    const messages = messagesOf(
      contactSchema.safeParse({ name: "Al", email: "nope", message: "Hi" }),
    );
    expect(messages).toContain("Name must be at least 3 characters.");
    expect(messages).toContain("Please enter a valid email.");
    expect(messages).toContain("Message must be at least 3 characters.");
  });
});

describe("loginSchema", () => {
  it("accepts a valid email and a 3+ char password", () => {
    expect(
      loginSchema.safeParse({ email: "a@b.com", password: "abc" }).success,
    ).toBe(true);
  });

  it("reports the email and password messages when both are invalid", () => {
    const messages = messagesOf(
      loginSchema.safeParse({ email: "nope", password: "ab" }),
    );
    expect(messages).toContain("Please enter a valid email.");
    expect(messages).toContain("Password must be at least 3 characters.");
  });
});

describe("editUserSchema", () => {
  it("accepts a valid name and email", () => {
    expect(
      editUserSchema.safeParse({ name: "Alice", email: "a@b.com" }).success,
    ).toBe(true);
  });

  it("uses the canonical 'User name…' message (not the old 'Member name…')", () => {
    const messages = messagesOf(
      editUserSchema.safeParse({ name: "Al", email: "nope" }),
    );
    expect(messages).toContain("User name must be at least 3 characters.");
    expect(messages).not.toContain(
      "Member name must be at least 3 characters.",
    );
    expect(messages).toContain("Please enter a valid email.");
  });
});
