import { FileDownloader } from "@/components/FileDownloader";
import { Locale } from "@/i18n/config";
import { notFound } from "next/navigation";

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

export default async function Page({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { id } = await params;
  const filesMetadata = await getFilesMetadata(id);
  return <FileDownloader filesMetadata={filesMetadata} />;
}
