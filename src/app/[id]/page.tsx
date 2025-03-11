import { FileDownloader } from "@/components/FileDownloader";
import { notFound } from "next/navigation";

export interface FileItem {
  id: string;
  name: string;
  blob: Blob;
}

async function getFiles(id: string): Promise<FileItem[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_TRANSFER}/${id}`);
  const json = await res.json();

  if (!res.ok) {
    notFound();
  }

  const files = await Promise.all(
    json.map(async (file: { url: string; name: string }, index: number) => {
      const r = await fetch(file.url);
      const blob = await r.blob();
      return {
        id: file.name + index,
        blob: blob,
        name: file.name,
      };
    })
  );
  return files;
  // eslint-disable-next-line
}

export default async function Page({ params }: { params: { id: string } }) {
  const { id } = await params;
  const files = await getFiles(id);
  return <FileDownloader initialFiles={files} />;
}
