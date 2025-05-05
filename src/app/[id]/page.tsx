import { FileDownloader } from "@/components/FileDownloader"
import { notFound } from "next/navigation"

export interface FileMetadata {
  id: string
  name: string
  url: string
  type?: string
  size?: number
}

async function getFilesMetadata(id: string): Promise<FileMetadata[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_TRANSFER}/${id}`)
  if (!res.ok) notFound()

  const json = await res.json()

  // Only return metadata and URLs, not the actual file content
  const filesMetadata = json.map(
    (
      file: { url: string; name: string; type: string; size: number },
      index: number,
    ): FileMetadata => ({
      id: `${file.name}-${index}`,
      name: file.name,
      url: file.url,
      size: file.size,
    }),
  )

  return filesMetadata
}

export default async function Page({ params }: { params: { id: string } }) {
  const { id } = params
  const filesMetadata = await getFilesMetadata(id)
  return <FileDownloader filesMetadata={filesMetadata} />
}
