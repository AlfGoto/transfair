import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
  localeDetection: false
});

export const config = {
  // Match only internationalized pathnames, excluding API routes and static files
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/fr/:path*']
};
