import { FileDownloader } from "@/components/FileDownloader"
import { notFound } from "next/navigation"

export interface FileMetadata {
  id: string
  name: string
  url: string
  type?: string
}

async function getFilesMetadata(id: string): Promise<FileMetadata[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_TRANSFER}/${id}`)
  if (!res.ok) notFound()

  const json = await res.json()

  // Only return metadata and URLs, not the actual file content
  const filesMetadata = json.map(
    (file: { url: string; name: string; type: string }, index: number) => ({
      id: `${file.name}-${index}`,
      name: file.name,
      url: file.url,
    }),
  )

  return filesMetadata
}

export default async function Page({ params }: { params: { id: string } }) {
  const { id } = params
  const filesMetadata = await getFilesMetadata(id)
  return <FileDownloader filesMetadata={filesMetadata} />
}
