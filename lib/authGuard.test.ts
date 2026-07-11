// lib/authGuard.test.ts
// The Phase 4b crown jewel (issue #153): a regression test for requireAdmin(),
// the server-session authorization boundary that closed the Phase-0
// privilege-escalation hole (AUDIT #83 — mutating actions used to trust a
// client-supplied `role` argument). If this guard ever regresses, a forged
// non-admin session could slip through, so we pin its three behaviours here.
//
// Mocking strategy:
//   - `@/lib/auth` is replaced with a factory exposing a controllable
//     `auth.api.getSession` mock. This is essential, not cosmetic: the real
//     module constructs a Better Auth instance with a live `new MongoClient`
//     pool and imports the fail-fast `@/lib/env` (which throws if secrets are
//     unset). Mocking it keeps the test pure and offline.
//   - `next/headers` is mocked so `await headers()` doesn't throw the
//     "called outside a request scope" error Next raises off the request path.
//   - `vi.hoisted` creates the `getSession` mock before Vitest hoists the
//     `vi.mock` factory above the imports, so the factory can close over it and
//     each test can drive the return value.
import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireAdmin } from "@/lib/authGuard";

const getSession = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession } },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(() => new Headers()),
}));

describe("requireAdmin", () => {
  beforeEach(() => {
    getSession.mockReset();
  });

  it("throws when there is no session (logged-out request)", async () => {
    getSession.mockResolvedValue(null);

    await expect(requireAdmin()).rejects.toThrow(
      "Unauthorized: admin access required",
    );
  });

  it("throws for a forged non-admin session (role:'user')", async () => {
    // The exact attack AUDIT #83 guards against: a real session whose role is
    // anything other than "admin" must be rejected, not trusted.
    getSession.mockResolvedValue({ user: { id: "u1", role: "user" } });

    await expect(requireAdmin()).rejects.toThrow(
      "Unauthorized: admin access required",
    );
  });

  it("returns the session unchanged when the user is an admin", async () => {
    const session = { user: { id: "a1", role: "admin" } };
    getSession.mockResolvedValue(session);

    // Reference equality: requireAdmin returns the very session it received.
    await expect(requireAdmin()).resolves.toBe(session);
  });
});
