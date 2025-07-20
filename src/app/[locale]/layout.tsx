import "../globals.css";
import { Inter } from "next/font/google";
import { Header } from "@/components/Header";
import { Providers } from "@/components/Providers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Locale, locales } from "@/i18n/config";
import {
  generateHreflangAlternates,
  generateCanonicalUrl,
} from "@/lib/seo-utils";
import type { Metadata } from "next";

const inter = Inter({
  subsets: ["latin"],
  preload: true,
  display: "swap",
});

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale: localeString } = await params;

  // Ensure that the incoming `locale` is valid
  if (!locales.includes(localeString as Locale)) {
    notFound();
  }

  const locale = localeString as Locale;
  const t = await getTranslations({ locale, namespace: "seo" });

  const hreflangAlternates = generateHreflangAlternates();
  const canonicalUrl = generateCanonicalUrl(locale);
  const currentUrl = generateCanonicalUrl(locale);

  // Get alternate locales for OpenGraph (all locales except current)
  const alternateLocales = locales.filter((l) => l !== locale);

  const baseMetadata = {
    title: {
      default: t("title"),
      template: t("titleTemplate"),
    },
    description: t("description"),
    keywords: t("keywords"),
    authors: [{ name: "Transfair" }],
    creator: "Transfair",
    publisher: "Transfair",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL("https://transfair.dev"),
    alternates: {
      canonical: canonicalUrl,
      languages: hreflangAlternates,
    },
    openGraph: {
      type: "website",
      locale: locale,
      alternateLocale: alternateLocales,
      url: currentUrl,
      siteName: "Transfair",
      title: t("ogTitle"),
      description: t("ogDescription"),
      images: [
        {
          url: "/icon.png",
          width: 512,
          height: 512,
          alt: "Transfair Logo",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@transfair",
      creator: "@transfair",
      title: t("twitterTitle"),
      description: t("twitterDescription"),
      images: ["/icon.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large" as const,
        "max-snippet": -1,
      },
    },
    verification: {
      google: "your-google-verification-code", // Replace with actual verification code
    },
  };

  return baseMetadata;
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Await params before using its properties
  const { locale: localeString } = await params;
  // Ensure that the incoming `locale` is valid
  if (!locales.includes(localeString as Locale)) {
    notFound();
  }

  const locale = localeString as Locale;
  const hreflangAlternates = generateHreflangAlternates();

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} className="h-full">
      <head>
        <meta name="google-adsense-account" content="ca-pub-9853522416934473" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9853522416934473"
          crossOrigin="anonymous"
        ></script>
        <link rel="icon" href="/icon.png" type="image/png" />

        {/* Hreflang tags for international SEO */}
        {Object.entries(hreflangAlternates).map(([hreflang, href]) => (
          <link
            key={hreflang}
            rel="alternate"
            hrefLang={hreflang}
            href={href}
          />
        ))}

        {/* Additional meta tags for better SEO */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#000000" />
        <meta name="color-scheme" content="light" />
        <meta
          name="format-detection"
          content="telephone=no, date=no, email=no, address=no"
        />

        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" />

        {/* Apple specific meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Transfair" />

        {/* Microsoft specific meta tags */}
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body
        className={`${inter.className} flex min-h-full flex-col w-full bg-background text-foreground`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <Header />
            <main className="flex-1 w-full flex">{children}</main>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
