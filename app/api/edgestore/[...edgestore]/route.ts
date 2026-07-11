import { initEdgeStore } from "@edgestore/server";
import {
  createEdgeStoreNextHandler,
  type CreateContextOptions,
} from "@edgestore/server/adapters/next/app";
import { auth } from "@/lib/auth";

// AUDIT #125 (issue #125): close an unauthenticated-upload hole. This handler
// hands out the signed URLs the client uses to write to the bucket, and it
// previously mounted `es.fileBucket()` with NO context and NO access control —
// so any caller (logged-out, or a non-admin logged-in user) who hit this route
// directly could obtain a signed URL and upload/delete files in the bucket.
//
// The dashboard forms' client-side role check (e.g. NewWorkForm.tsx) is a UX
// hint only, and the `requireAdmin()` gate on the follow-up server action
// (createWork/createMember/…) only ever protected the DB write — by the time it
// ran, the file was already in the bucket. The upload itself was never guarded.
//
// The fix derives the caller's role from the Better Auth server session (never
// from client input — the same invariant lib/authGuard.ts enforces) and rejects
// non-admins in the bucket's beforeUpload/beforeDelete hooks, before any signed
// URL is issued. Both hooks are gated: the forms only ever call `.upload(...)`
// today, but the same handler also exposes `.delete(...)`, so leaving delete
// open would be the same hole by another name.

/**
 * Per-request context for the EdgeStore handler. `userRole` comes from the
 * Better Auth server session and is the only thing the access-control hooks
 * below key off.
 *
 * IMPORTANT — this MUST NOT throw for anonymous callers. The <EdgeStoreProvider>
 * is mounted in app/[locale]/layout.tsx, i.e. on every page of the PUBLIC site,
 * and its client init request flows through this same handler (and therefore
 * this createContext). Throwing here would break the provider — and thus every
 * public page — for logged-out visitors. So we resolve the role leniently
 * (null when there is no session) and let the per-bucket hooks do the rejecting.
 */
type Context = {
  userId: string | null;
  userRole: string | null;
};

async function createContext({ req }: CreateContextOptions): Promise<Context> {
  const session = await auth.api.getSession({ headers: req.headers });
  return {
    userId: session?.user?.id ?? null,
    userRole: session?.user?.role ?? null,
  };
}

const es = initEdgeStore.context<Context>().create();

/**
 * The main router for the Edge Store buckets.
 *
 * `beforeUpload` / `beforeDelete` run server-side while EdgeStore decides whether
 * to grant a signed URL. Returning `false` denies the operation *before* any URL
 * is handed out, so a non-admin never touches the bucket. This is the real
 * security boundary for uploads and deletes (issue #125).
 */
const edgeStoreRouter = es.router({
  publicFiles: es
    .fileBucket()
    .beforeUpload(({ ctx }) => ctx.userRole === "admin")
    .beforeDelete(({ ctx }) => ctx.userRole === "admin"),
});

const handler = createEdgeStoreNextHandler({
  router: edgeStoreRouter,
  createContext,
});

export { handler as GET, handler as POST };

// Phase 3: export the router's type so the client provider in `lib/edgestore.ts`
// can be instantiated as `createEdgeStoreProvider<EdgeStoreRouter>()`. That
// generic is what makes the forms' `edgestore.publicFiles.upload(...)` calls
// type-checked. Only the *type* is imported on the client, so no server code
// crosses the boundary.
export type EdgeStoreRouter = typeof edgeStoreRouter;
