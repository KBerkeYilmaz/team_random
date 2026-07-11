"use server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/authGuard";
import { z } from "zod";
import type { ActionState } from "@/actions/types";
import { updatePasswordSchema, type UpdatePasswordInput } from "@/actions/schemas";

// The current user's own-account edit payloads (the values each form submits).
type UpdateUserInput = { name: string; email: string };

// AUDIT #83 (issue #82): every action below is gated by requireAdmin(), which
// derives the admin role from the server session. Previously each took a `role`
// argument FROM THE CLIENT and checked `if (role !== "admin")`, so a forged
// request passing role:"admin" bypassed authorization entirely.
//
// AUDIT #87 (Phase 1): these actions manage the CURRENT user's own account. They
// now go through Better Auth's server API (auth.api.updateUser / changePassword)
// instead of the legacy Mongoose `User` model — so they read and write Better
// Auth's `user`/`account` collections, which became the source of truth after the
// migration (the legacy `users` collection is no longer used). Better Auth
// identifies the user from the session in `headers()`, so the `id` argument is
// now unused (kept only so existing call sites need no change).
//
// Email change is intentionally deferred: Better Auth requires a verification
// flow for it, which needs email-sending infrastructure not yet wired up. Rather
// than silently drop an email edit, updateUser rejects it with a clear message.
export const updateUser = async (
  formData: UpdateUserInput,
  id: string,
): Promise<ActionState> => {
  const userSchema = z.object({
    fullName: z.string().min(3, "User name must be at least 3 characters."),
    userMail: z.string().email("Please enter a valid email."),
  });

  const validatedFields = userSchema.safeParse({
    fullName: formData.name,
    userMail: formData.email,
  });

  // Return early if the form data is invalid
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await requireAdmin();
    const h = await headers();

    // Email changes need a verification flow that isn't wired up yet, so
    // reject the whole update up-front (rather than silently dropping the new
    // email) when the email differs from the session's current email.
    const session = await auth.api.getSession({ headers: h });
    if (session?.user?.email !== formData.email) {
      return {
        error:
          "Email changes aren't available yet — they require email verification (a later phase). No changes were saved.",
      };
    }

    // Update the name (a core Better Auth user field).
    await auth.api.updateUser({ body: { name: formData.name }, headers: h });

    return {};
  } catch (error) {
    console.error((error as Error)?.message ?? error);
    return { error: "Something went wrong" };
  }
};

export const updateUserImage = async (
  imgUrl: string,
  id: string,
): Promise<ActionState> => {
  try {
    await requireAdmin();
    await auth.api.updateUser({
      body: { image: imgUrl },
      headers: await headers(),
    });
    return {};
  } catch (error) {
    console.error((error as Error)?.message ?? error);
    return { error: "Something went wrong" };
  }
};

export const updateUserPassword = async (
  formData: UpdatePasswordInput,
  id: string,
): Promise<ActionState> => {
  // Shared with EditUserPasswordForm via actions/schemas.ts so client and server
  // password rules can't drift (issue #126).
  const validatedFields = updatePasswordSchema.safeParse({
    currentPassword: formData.currentPassword,
    newPassword: formData.newPassword,
    passwordConfirmation: formData.passwordConfirmation,
  });

  // Return early if the form data is invalid
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await requireAdmin();
    // Better Auth verifies the current password and writes a new bcrypt hash
    // to the `account` collection (our custom hash/verify is preserved).
    await auth.api.changePassword({
      body: {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      },
      headers: await headers(),
    });

    return {};
  } catch (error) {
    // The dominant failure here is a wrong current password.
    const message = String((error as Error)?.message ?? "").toLowerCase();
    if (message.includes("password")) {
      return { error: "Wrong Password" };
    }
    return { error: "Something went wrong" };
  }
};
