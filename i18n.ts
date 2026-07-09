import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { locales } from './config';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid. `locales` is a
  // readonly tuple ("en" | "tr"); widen it so the runtime string `locale` is an
  // accepted argument to .includes() under strict mode. (Kept SYNC — Phase 4's
  // Next 16 codemod makes the next-intl request config async, not this phase.)
  if (!(locales as readonly string[]).includes(locale)) notFound();
  return {
    messages: (
      await (locale === 'en'
        ? // When using Turbopack, this will enable HMR for `en`
        import('./messages/en.json')
        : import(`./messages/${locale}.json`))
    ).default
  };
});