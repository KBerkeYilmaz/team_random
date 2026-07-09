import { createLocalizedPathnamesNavigation } from 'next-intl/navigation';
import type { ComponentProps } from 'react';
import { locales, pathnames, localePrefix } from './config';

// Phase 3 (TypeScript) — navigation typing note.
//
// The `pathnames` map in config.ts only declares "/" and a vestigial, unused
// "/pathnames" (there is no such route/page, and nothing links to it). Because
// createLocalizedPathnamesNavigation derives its types from that map, it types
// Link `href`, usePathname() and router.push()/replace() to the tiny union
// "/" | "/pathnames" — which REJECTS every real route the app navigates to
// (/about, /login, /dashboard, /dashboard/works/[id], …). Those routes are used
// as plain strings throughout.
//
// The runtime navigation bindings are kept EXACTLY as-is (no behaviour change);
// only their exported TYPES are widened to the plain-string shape the routes are
// actually used as — the same shape createSharedPathnamesNavigation would give.
// This is a type-only concession centralised in one file so no call site needs a
// cast. A later phase should either complete the `pathnames` map or switch to
// createSharedPathnamesNavigation and drop this widening. See
// docs/migration/phase3/typescript-migration.md.
const navigation = createLocalizedPathnamesNavigation({
    locales,
    pathnames,
    localePrefix,
});

type NavLocale = (typeof locales)[number];

export const Link = navigation.Link as unknown as (
    props: Omit<ComponentProps<'a'>, 'href'> & {
        href: string;
        locale?: NavLocale;
    },
) => JSX.Element;

export const redirect = navigation.redirect as unknown as (
    href: string,
) => never;

export const usePathname = navigation.usePathname as unknown as () => string;

export const useRouter = navigation.useRouter as unknown as () => {
    push: (href: string, options?: { locale?: string }) => void;
    replace: (href: string, options?: { locale?: string }) => void;
    prefetch: (href: string, options?: { locale?: string }) => void;
    back: () => void;
    forward: () => void;
    refresh: () => void;
};
