// middleware.ts
// Locale routing (next-intl) + an optimistic auth gate (Better Auth).
//
// AUDIT #87 (Phase 1): the next-auth `withAuth` wrapper is replaced by an
// OPTIMISTIC Better Auth session-cookie check. Per Better Auth's docs a
// middleware cookie check is NOT a security boundary — it only confirms a
// session cookie is present, not that it is valid or that the user is an admin.
// Real admin enforcement stays in the dashboard layout (auth.api.getSession).
// The next-intl composition is unchanged from the previous middleware.js.
import createIntlMiddleware from "next-intl/middleware";
import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

const locales = ["en", "tr"];
const publicPages = ["/", "/login", "/works", "/about"];

const intlMiddleware = createIntlMiddleware({
  locales,
  localePrefix: "as-needed",
  defaultLocale: "en",
});

export default function middleware(req: NextRequest) {
  const publicPathnameRegex = RegExp(
    `^(/(${locales.join("|")}))?(${publicPages
      .flatMap((p) => (p === "/" ? ["", "/"] : p))
      .join("|")})/?$`,
    "i",
  );
  const isPublicPage = publicPathnameRegex.test(req.nextUrl.pathname);

  if (isPublicPage) {
    return intlMiddleware(req);
  }

  // Optimistic gate: no session cookie → bounce to login. Not a trust boundary.
  const sessionCookie = getSessionCookie(req);
  if (!sessionCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
