import { FileDownloader } from "@/components/FileDownloader";
import { Locale } from "@/i18n/config";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export interface FileMetadata {
  id: string;
  name: string;
  url: string;
  type?: string; // Optional MIME type if available from API
}

async function getFilesMetadata(id: string): Promise<FileMetadata[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_TRANSFER}/${id}`);
  if (!res.ok) notFound();

  const json = await res.json();

  // Only return metadata and URLs, not the actual file content
  const filesMetadata = json.map(
    (file: { url: string; name: string }, index: number) => ({
      id: `${file.name}-${index}`,
      name: file.name,
      url: file.url,
      // If the API provides type information, include it here
    })
  );

  return filesMetadata;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });

  try {
    const filesMetadata = await getFilesMetadata(id);
    const fileCount = filesMetadata.length;
    const fileNames = filesMetadata.map((file) => file.name).join(", ");

    return {
      title: t("downloadTitle", { count: fileCount }),
      description: t("downloadDescription", { count: fileCount, fileNames }),
      robots: {
        index: false, // Don't index temporary download pages
        follow: false,
        noarchive: true,
        nosnippet: true,
      },
      openGraph: {
        title: t("downloadOgTitle"),
        description: t("downloadOgDescription", { count: fileCount }),
        type: "website",
      },
    };
  } catch {
    // If files are not found or expired, return basic metadata
    return {
      title: t("downloadNotFoundTitle"),
      description: t("downloadNotFoundDescription"),
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { id } = await params;
  const filesMetadata = await getFilesMetadata(id);
  return <FileDownloader filesMetadata={filesMetadata} />;
}
