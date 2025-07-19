"use client";

import { SessionProvider } from "next-auth/react";
import { FileUploader } from "../../components/FileUploader";
import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("common");

  return (
    <SessionProvider>
      <div className="max-w-4xl mx-auto mt-10">
        <h1 className="text-2xl font-bold mb-4">{t("uploadFiles")}</h1>
        <FileUploader apiUrl={String(process.env.NEXT_PUBLIC_API_TRANSFER)} />
      </div>
    </SessionProvider>
  );
}
