// app/api/auth/[...all]/route.ts
// Better Auth Next.js route handler — replaces app/api/auth/[...nextauth]/route.js.
//
// AUDIT #87: Better Auth serves every auth endpoint (sign-in, sign-out, get
// session, etc.) under /api/auth/* through this single catch-all handler. The
// old next-auth [...nextauth] route is deleted once all consumers are repointed.
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

export const { GET, POST } = toNextJsHandler(auth);
