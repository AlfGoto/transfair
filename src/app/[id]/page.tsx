import { FileDownloader } from "@/components/FileDownloader";
import { notFound } from "next/navigation";

export interface FileItem {
  id: string;
  name: string;
  data: string; // base64 encoded string
  mimeType: string;
}

async function getFiles(id: string): Promise<FileItem[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_TRANSFER}/${id}`);
  if (!res.ok) notFound();

  const json = await res.json();

  const files = await Promise.all(
    json.map(async (file: { url: string; name: string }, index: number) => {
      const response = await fetch(file.url);
      const blob = await response.blob();

      // Convert Blob to base64
      const buffer = await blob.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      return {
        id: `${file.name}-${index}`,
        name: file.name,
        data: base64,
        mimeType: blob.type,
      };
    })
  );

  return files;
}

export default async function Page({ params }: { params: { id: string } }) {
  const { id } = params;
  const files = await getFiles(id);
  return <FileDownloader initialFiles={files} />;
}
