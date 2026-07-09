import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// AUDIT #83 (issue #82): this route was previously unauthenticated and exported
// as BOTH POST and GET, so anyone could create users. It also wrote `role` from
// the request body (privilege escalation) and leaked the bcrypt hash in the
// response. The GET export was removed and creation was locked to admins with
// role forced to "user".
//
// AUDIT #87 (Phase 1): creation moves off the direct Mongoose `User.create`
// (legacy `users` collection, next-auth) onto Better Auth's admin API, so new
// accounts land in Better Auth's `user`/`account` collections and can actually
// sign in. The admin plugin authorizes the caller (must be an admin); role is
// still forced to "user" server-side and never read from the request body.
export async function POST(req: Request) {
  const body = await req.json();

  try {
    const created = await auth.api.createUser({
      body: {
        email: body.email,
        password: body.password,
        name: body.fullName,
        role: "user", // never trust a client-supplied role
        // `image` is a core Better Auth user field; extra fields go via `data`.
        data: body.img ? { image: body.img } : undefined,
      },
      // The admin plugin authorizes this call against the caller's session.
      headers: await headers(),
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    // Better Auth throws an APIError carrying an HTTP status (401/403 for a
    // non-admin caller, 422 for a duplicate email, etc.).
    const err = error as { statusCode?: number; status?: number };
    const status =
      typeof err?.statusCode === "number"
        ? err.statusCode
        : typeof err?.status === "number"
          ? err.status
          : 400;
    return NextResponse.json({ error: "User creation failed" }, { status });
  }
}
