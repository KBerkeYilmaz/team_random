// lib/auth-client.ts
// Better Auth browser client — replaces next-auth/react (useSession/signIn/signOut).
//
// AUDIT #87: Client components import their session helpers from here instead of
// "next-auth/react". The adminClient() plugin mirrors the server-side admin
// plugin so that `session.user.role` is typed and available on the client for
// UX hints (the real authorization boundary stays server-side).
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [adminClient()],
});

export const { useSession, signIn, signOut } = authClient;
