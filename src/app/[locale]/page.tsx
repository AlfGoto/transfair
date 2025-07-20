"use client";

import { SessionProvider } from "next-auth/react";
import { FileUploader } from "../../components/FileUploader";
import { useTranslations } from "next-intl";

// JSON-LD structured data for better SEO  
function generateStructuredData(t: (key: string) => string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Transfair",
    description: t("structuredDataDescription"),
    url:
      typeof window !== "undefined"
        ? window.location.origin
        : "https://transfair.dev",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      t("featureUpload"),
      t("featureLinks"),
      t("featureNoRegistration"),
      t("featureSecure"),
      t("featureMultiple"),
    ],
    creator: {
      "@type": "Organization",
      name: "Transfair",
    },
  };
}

export default function Home() {
  const t = useTranslations("common");
  const seoT = useTranslations("seo");

  const structuredData = generateStructuredData(seoT);

  return (
    <SessionProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <div className="max-w-4xl mx-auto mt-10">
        <h1 className="text-2xl font-bold mb-2">{t("uploadFiles")}</h1>
        <p className="text-gray-600 mb-6">
          {t("uploadSubtitle")}
        </p>
        <FileUploader apiUrl={String(process.env.NEXT_PUBLIC_API_TRANSFER)} />
      </div>
    </SessionProvider>
  );
}
