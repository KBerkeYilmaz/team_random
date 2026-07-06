// lib/authGuard.js
// Server-side authorization boundary for mutating server actions.
// Role is derived from the server session — never from client input.
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

/**
 * Throws a messaged error if there is no session or the session user is not an
 * admin. Returns the session on success. Call at the top of every mutating action.
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    throw new Error("Unauthorized: admin access required");
  }
  return session;
}
