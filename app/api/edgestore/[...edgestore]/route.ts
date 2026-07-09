import { initEdgeStore } from '@edgestore/server';
import { createEdgeStoreNextHandler } from '@edgestore/server/adapters/next/app';

const es = initEdgeStore.create();

/**
 * This is the main router for the Edge Store buckets.
 */
const edgeStoreRouter = es.router({
  publicFiles: es.fileBucket(),
});

const handler = createEdgeStoreNextHandler({
  router: edgeStoreRouter,
});

export { handler as GET, handler as POST };

// Phase 3: export the router's type so the client provider in `lib/edgestore.ts`
// can be instantiated as `createEdgeStoreProvider<EdgeStoreRouter>()`. That
// generic is what makes the forms' `edgestore.publicFiles.upload(...)` calls
// type-checked. Only the *type* is imported on the client, so no server code
// crosses the boundary.
export type EdgeStoreRouter = typeof edgeStoreRouter;

