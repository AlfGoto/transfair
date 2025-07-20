import { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { generateHreflangAlternates } from "@/lib/seo-utils";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://transfair.dev";

  // Generate sitemap entries for each locale
  const localePages = locales.flatMap((locale) => {
    const homeAlternates = generateHreflangAlternates(baseUrl);
    const helpAlternates = generateHreflangAlternates(baseUrl, "/help");

    // Remove x-default from sitemap alternates (only used in hreflang)
    const homeLanguages = Object.fromEntries(
      Object.entries(homeAlternates).filter(([key]) => key !== "x-default")
    );
    const helpLanguages = Object.fromEntries(
      Object.entries(helpAlternates).filter(([key]) => key !== "x-default")
    );

    return [
      // Homepage for each locale
      {
        url: homeAlternates[locale],
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 1,
        alternates: {
          languages: homeLanguages,
        },
      },
      // Help page for each locale
      {
        url: helpAlternates[locale],
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
        alternates: {
          languages: helpLanguages,
        },
      },
    ];
  });

  return localePages;
}
