import { FileDownloader } from "@/components/FileDownloader";

interface DownloadPageProps {
  params: { id: string };
}

interface FileItem {
  id: string;
  name: string;
  type: string;
  url: string;
}

async function getFiles(id: string): Promise<FileItem[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_TRANSFER}/${id}`);
  if (!res.ok) {
    throw new Error("Failed to fetch files");
  }
  const files: FileItem[] = await res.json();
  return files;
}

export default async function Page({ params }: DownloadPageProps) {
  const { id } = params;
  const files = await getFiles(id);
  return <FileDownloader initialFiles={files} />;
}
