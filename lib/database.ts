// lib/database.ts
// Phase 2 (issue #96): cached Mongoose connection.
//
// The previous lib/database.js called mongoose.connect() on EVERY server-action
// invocation (no caching at all) and, on failure, called process.exit(1) — a
// hard process kill that is catastrophic under serverless / Next.js, where it
// tears down the whole worker instead of failing a single request. This module
// instead caches the connection *promise* on the global object so concurrent
// requests and dev hot-reloads reuse one connection, and it THROWS on failure
// (resetting the cache so the next call retries) rather than killing the process.
import mongoose from "mongoose";
import { env } from "@/lib/env";

// The cache lives on the global object so it survives module re-evaluation across
// hot reloads in dev and is shared across all invocations within a single
// serverless instance. Caching the *promise* (not just the resolved connection)
// means parallel callers that arrive during the initial connect all await the
// same in-flight attempt instead of opening competing connections.
declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache:
    | { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
    | undefined;
}

const cached =
  globalThis._mongooseCache ??
  (globalThis._mongooseCache = { conn: null, promise: null });

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    // bufferCommands:false makes queries fail fast when the connection is down
    // rather than buffering them indefinitely.
    cached.promise = mongoose.connect(env.MONGO_URI, { bufferCommands: false });
  }
  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Reset the cached promise so a transient connect failure doesn't permanently
    // poison the cache — the next call retries a fresh connection.
    cached.promise = null;
    throw err;
  }
  return cached.conn;
}

export default connectDB;
