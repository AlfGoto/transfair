import { FileDownloader } from "@/components/FileDownloader";

// Define the correct props interface
interface PageProps {
  params: { id: string };
}

async function getFiles(id: string): Promise<FileItem[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_TRANSFER}/${id}`);
  if (!res.ok) throw new Error("Failed to fetch files");
  return res.json();
}

export default async function Page({ params }: PageProps) {
  const files = await getFiles(params.id);
  return <FileDownloader initialFiles={files} />;
}

interface FileItem {
  id: string;
  name: string;
  type: string;
  url: string;
}
