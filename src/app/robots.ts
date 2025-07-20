import { MetadataRoute } from "next";
import { locales, defaultLocale } from "@/i18n/config";

export default function robots(): MetadataRoute.Robots {
  // Generate disallow patterns for download IDs in all locales
  const downloadPatterns = locales.map((locale) => {
    const localePath = locale === defaultLocale ? "" : `/${locale}`;
    return `${localePath}/[id]`;
  });

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          ...downloadPatterns, // Protect temporary download links from indexing
          "/api/", // Protect API endpoints
        ],
      },
    ],
    sitemap: "https://transfair.dev/sitemap.xml",
    host: "https://transfair.dev",
  };
}
