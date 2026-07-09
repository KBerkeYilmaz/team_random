// lib/authGuard.ts
// Server-side authorization boundary for mutating server actions.
// Role is derived from the server session — never from client input.
//
// AUDIT #83 (issue #82): added to close a privilege-escalation hole. Mutating
// actions previously trusted a `role` argument passed from the client and gated
// on `if (role !== "admin")`, so a forged request with role:"admin" bypassed all
// authorization. requireAdmin() replaces that with a server-session check.
//
// AUDIT #87 (Phase 1): the session now comes from Better Auth
// (auth.api.getSession) instead of next-auth (getServerSession(authOptions)).
// The guarantee is unchanged — role is read from the server session, never the
// client — only the auth engine differs.
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Throws a messaged error if there is no session or the session user is not an
 * admin. Returns the session on success. Call at the top of every mutating action.
 */
export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user?.role !== "admin") {
    throw new Error("Unauthorized: admin access required");
  }
  return session;
}
