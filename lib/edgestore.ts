'use client';

import { createEdgeStoreProvider } from '@edgestore/react';
import { type EdgeStoreRouter } from '@/app/api/edgestore/[...edgestore]/route';

// The `EdgeStoreRouter` import is type-only (erased at build), so the server-only
// route module is never pulled into the client bundle. The generic gives the
// returned `useEdgeStore()` hook a typed `edgestore.publicFiles` API.
const { EdgeStoreProvider, useEdgeStore } =
  createEdgeStoreProvider<EdgeStoreRouter>();

export { EdgeStoreProvider, useEdgeStore };
