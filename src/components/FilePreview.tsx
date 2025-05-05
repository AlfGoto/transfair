"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  FileText,
  X,
  ImageIcon,
  FileCode,
  FileJson,
  FileSpreadsheet,
  FileArchive,
  FileAudio,
  FileVideo,
  FileIcon as FilePdf,
  FileIcon as FilePresentation,
  FileQuestion,
  Loader2,
  Download,
} from "lucide-react"
import Image from "next/image"
import { memo, useEffect, useState } from "react"
import { formatSize } from "@/lib/utils"

type FileWithProgress = {
  id: string
  name: string
  type?: string
  size?: number
  preview?: string
  progress?: number
  status?: "pending" | "downloading" | "complete" | "error"
  objectUrl?: string
}

type FileItem = {
  id: string
  name: string
  type: string
  size: number
  file: File
  preview?: string
}

type FilePreviewProps = {
  file: FileWithProgress | FileItem
  onRemove?: (id: string) => void
  onDownload?: () => void
  onRetry?: () => void
  showDownloadProgress?: boolean
}

export const FilePreview = memo(function FilePreview({
  file,
  onRemove,
  onDownload,
  onRetry,
  showDownloadProgress = false,
}: FilePreviewProps) {
  const [localUrl, setLocalUrl] = useState<string | null>(null)
  const isFileItem = "file" in file

  useEffect(() => {
    if (isFileItem && file.file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file.file)
      setLocalUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [isFileItem, file])

  const getFileIcon = () => {
    const type = isFileItem ? file.file.type : file.type || ""
    const name = file.name
    const extension = name.split(".").pop()?.toLowerCase()

    switch (extension) {
      case "pdf":
        return <FilePdf className="h-8 w-8 text-muted-foreground" />
      case "doc":
      case "docx":
        return <FileText className="h-8 w-8 text-muted-foreground" />
      case "xls":
      case "xlsx":
      case "csv":
        return <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
      case "ppt":
      case "pptx":
        return <FilePresentation className="h-8 w-8 text-muted-foreground" />
      case "zip":
      case "rar":
      case "7z":
      case "tar":
      case "gz":
        return <FileArchive className="h-8 w-8 text-muted-foreground" />
      case "mp3":
      case "wav":
      case "ogg":
      case "flac":
        return <FileAudio className="h-8 w-8 text-muted-foreground" />
      case "mp4":
      case "mov":
      case "avi":
      case "mkv":
      case "webm":
        return <FileVideo className="h-8 w-8 text-muted-foreground" />
      case "json":
        return <FileJson className="h-8 w-8 text-muted-foreground" />
      case "js":
      case "ts":
      case "jsx":
      case "tsx":
      case "html":
      case "css":
      case "xml":
      case "md":
      case "yml":
      case "yaml":
        return <FileCode className="h-8 w-8 text-muted-foreground" />
    }

    if (type.startsWith("image/")) {
      return <ImageIcon className="h-8 w-8 text-muted-foreground" />
    } else if (type.startsWith("text/")) {
      return <FileText className="h-8 w-8 text-muted-foreground" />
    } else if (type.startsWith("audio/")) {
      return <FileAudio className="h-8 w-8 text-muted-foreground" />
    } else if (type.startsWith("video/")) {
      return <FileVideo className="h-8 w-8 text-muted-foreground" />
    } else if (type.includes("pdf")) {
      return <FilePdf className="h-8 w-8 text-muted-foreground" />
    } else if (type.includes("spreadsheet") || type.includes("csv")) {
      return <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
    } else if (type.includes("archive") || type.includes("zip")) {
      return <FileArchive className="h-8 w-8 text-muted-foreground" />
    } else if (type.includes("json")) {
      return <FileJson className="h-8 w-8 text-muted-foreground" />
    }

    return <FileQuestion className="h-8 w-8 text-muted-foreground" />
  }

  const renderPreviewContent = () => {
    // Common loading states
    if (showDownloadProgress && "status" in file && file.status === "pending") {
      return (
        <div className="w-full h-32 sm:h-40 bg-muted flex items-center justify-center">
          <div className="flex flex-col items-center">
            <FileQuestion className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">En attente...</p>
          </div>
        </div>
      )
    }

    if (
      showDownloadProgress &&
      "status" in file &&
      file.status === "downloading"
    ) {
      return (
        <div className="w-full h-32 sm:h-40 bg-muted flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">{file.progress}%</p>
          </div>
        </div>
      )
    }

    // Image preview handling
    const imageUrl = isFileItem
      ? localUrl
      : "objectUrl" in file
      ? file.objectUrl
      : null
    const isImage = isFileItem
      ? file.file.type.startsWith("image/")
      : file.type?.startsWith("image/")

    if (isImage && imageUrl) {
      return (
        <div className="relative w-full h-32 sm:h-40">
          <Image
            src={imageUrl}
            alt={file.name}
            fill
            style={{ objectFit: "cover" }}
            className="rounded-md"
            onLoadingComplete={() => {
              if (!isFileItem && file.objectUrl) {
                URL.revokeObjectURL(file.objectUrl)
              }
            }}
          />
        </div>
      )
    }

    // File preview handling
    return (
      <div className="w-full h-32 sm:h-40 bg-muted flex flex-col items-center justify-center p-4">
        {getFileIcon()}
        {file.preview ? (
          <ScrollArea className="h-full w-full rounded-md mt-2">
            <p className="text-xs text-muted-foreground font-mono p-2">
              {file.preview}
            </p>
          </ScrollArea>
        ) : (
          <span className="text-muted-foreground text-sm sm:text-base mt-2">
            {isFileItem ? file.file.type : file.type || "Unknown type"}
          </span>
        )}
      </div>
    )
  }

  return (
    <Card className="h-full group relative pointer-events-auto">
      {onRemove && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute -right-2 -top-2 z-10 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            onRemove(file.id)
          }}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Remove file</span>
        </Button>
      )}

      {onDownload && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onDownload()
          }}
          className="absolute top-2 right-2 h-8 px-2"
        >
          <Download className="h-4 w-4" />
          <span className="sr-only">Download file</span>
        </Button>
      )}

      <CardContent className="p-4 flex flex-col h-full">
        {renderPreviewContent()}

        <div className="mt-2 space-y-1">
          <p className="text-sm truncate">{file.name}</p>
          {file.size && file.size > 0 && (
            <p className="text-xs text-muted-foreground">
              {formatSize(isFileItem ? file.size : file.size || 0)}
            </p>
          )}
        </div>

        {showDownloadProgress &&
          "status" in file &&
          file.status === "error" &&
          onRetry && (
            <p className="text-xs text-red-500 mt-1">
              Download failed.
              <Button
                variant="link"
                className="p-0 h-auto text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  onRetry()
                }}
              >
                Try again
              </Button>
            </p>
          )}
      </CardContent>
    </Card>
  )
})
