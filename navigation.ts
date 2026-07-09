import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { locales, localePrefix } from './config';

// The app does not use localized pathnames — every route is navigated to as a
// plain string (/about, /login, /dashboard, /dashboard/works/[id], …). So we use
// createSharedPathnamesNavigation, whose Link `href`, usePathname() and
// router.push()/replace() are typed as `string` and accept all real routes.
//
// (Phase 3 history: config.ts once carried a vestigial, unused localized
// `pathnames` map and navigation.ts used createLocalizedPathnamesNavigation,
// which derived a "/" | "/pathnames" union that rejected every real route. That
// forced a type-only widening cast in this file as a stopgap. Issue #104 removed
// both by switching to the shared navigation — runtime behaviour is identical.)
export const { Link, redirect, usePathname, useRouter } =
    createSharedPathnamesNavigation({ locales, localePrefix });
