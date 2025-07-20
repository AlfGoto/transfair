import { locales, defaultLocale, Locale } from "@/i18n/config";

/**
 * Gets the URL path for a given locale
 * Default locale (English) uses root path, others use /locale prefix
 */
export function getLocalePath(locale: Locale): string {
  return locale === defaultLocale ? "" : `/${locale}`;
}

/**
 * Generates hreflang alternate URLs for all locales
 */
export function generateHreflangAlternates(
  baseUrl = "https://transfair.dev",
  path = ""
): Record<string, string> {
  const alternates: Record<string, string> = {};

  // Add each locale
  locales.forEach((locale) => {
    const localePath = getLocalePath(locale);
    alternates[locale] = `${baseUrl}${localePath}${path}`;
  });

  // Add x-default pointing to default locale
  const defaultPath = getLocalePath(defaultLocale);
  alternates["x-default"] = `${baseUrl}${defaultPath}${path}`;

  return alternates;
}

/**
 * Generates canonical URL for a given locale and path
 */
export function generateCanonicalUrl(
  locale: Locale,
  path = "",
  baseUrl = "https://transfair.dev"
): string {
  const localePath = getLocalePath(locale);
  return `${baseUrl}${localePath}${path}`;
}
