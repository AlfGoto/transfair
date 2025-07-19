import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";
import { locales, defaultLocale } from "./config";

export default getRequestConfig(async () => {
  // Determine the locale from the URL pathname
  const headersList = await headers();
  const pathname =
    headersList.get("x-pathname") || headersList.get("x-invoke-path") || "/";

  // Extract locale from pathname
  let locale = defaultLocale;

  // Check if pathname starts with a supported locale
  for (const supportedLocale of locales) {
    if (
      pathname === `/${supportedLocale}` ||
      pathname.startsWith(`/${supportedLocale}/`)
    ) {
      locale = supportedLocale;
      break;
    }
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
