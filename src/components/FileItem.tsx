"use client"

import { memo, useRef, useEffect } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { FilePreview } from "./FilePreview"
import type { FileMetadata } from "@/app/[id]/page"

interface FileWithProgress extends FileMetadata {
  progress: number
  status: "pending" | "downloading" | "complete" | "error"
  preview?: string
  objectUrl?: string
}

interface FileItemProps {
  file: FileWithProgress
  index: number
  isSelected: boolean
  onToggleSelect: (index: number) => void
  onDownloadSingle: (file: FileWithProgress) => void
  onRetry: (file: FileWithProgress, index: number) => void
}

const FileItem = memo(
  function FileItem({
    file,
    index,
    isSelected,
    onToggleSelect,
    onDownloadSingle,
    onRetry,
  }: FileItemProps) {
    const urlRef = useRef<string | undefined>(undefined)

    useEffect(() => {
      if (file.objectUrl && !urlRef.current) {
        urlRef.current = file.objectUrl
      }
    }, [file.objectUrl])

    const stableFile = {
      id: file.id,
      name: file.name,
      type: file.type,
      status: file.status,
      progress: file.progress,
      preview: file.preview,
      url: file.url,
      objectUrl: file.objectUrl,
    }

    return (
      <div className="relative">
        <div
          className="absolute top-6 left-6 z-10 dark:bg-gray-800 rounded-md p-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            id={`file-${file.id}`}
            className={isSelected ? "bg-white p-[1px] border-none" : ""}
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(index)}
          />
        </div>
        <div onClick={() => onToggleSelect(index)} className="cursor-pointer">
          <FilePreview
            file={{
              ...stableFile,
              objectUrl: file.objectUrl,
              type: file.type || "",
            }}
            onDownload={() => onDownloadSingle(file)}
            onRetry={() => onRetry(file, index)}
            showDownloadProgress={true}
          />
        </div>
      </div>
    )
  },
  (prevProps, nextProps) => {
    return (
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.file.status === nextProps.file.status &&
      prevProps.file.progress === nextProps.file.progress &&
      prevProps.file.objectUrl === nextProps.file.objectUrl
    )
  },
)

export { FileItem, type FileWithProgress }
