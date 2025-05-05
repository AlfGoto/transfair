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
import { memo } from "react"
import { formatSize } from "@/lib/utils"

// Original interface, preserved for backward compatibility
interface FilePreviewProps {
  file: {
    file?: Blob | MediaSource // Made optional to support both versions
    id: string
    name: string
    type?: string
    size?: number
    preview?: string
    // New optional properties for download functionality
    blob?: Blob
    progress?: number
    status?: "pending" | "downloading" | "complete" | "error"
    // New property for stable image URLs
    imageUrl?: string | null
  }
  onRemove?: (id: string) => void // Made optional
  // New optional props for download functionality
  onDownload?: () => void
  onRetry?: () => void
  showDownloadProgress?: boolean
}

// Memoized FilePreview component to prevent unnecessary re-renders
export const FilePreview = memo(function FilePreview({
  file,
  onRemove,
  onDownload,
  onRetry,
  showDownloadProgress = false,
}: FilePreviewProps) {
  const getFileIcon = (type = "", name: string) => {
    // Check file extension first
    const extension = name.split(".").pop()?.toLowerCase()

    // Check by extension
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

    // Check by MIME type if extension didn't match
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

    // Default icon
    return <FileQuestion className="h-8 w-8 text-muted-foreground" />
  }

  // Determine if we should show loading state
  const shouldShowLoading =
    showDownloadProgress &&
    file.status === "downloading" &&
    file.progress !== undefined

  // Determine if we should show image - with proper type checking
  const shouldShowImage = file.type ? file.type.startsWith("image/") : false

  // Render the preview content
  const renderPreviewContent = () => {
    // Show pending state
    if (showDownloadProgress && file.status === "pending") {
      return (
        <div className="w-full h-32 sm:h-40 bg-muted flex items-center justify-center min-w-[50px]">
          <div className="flex flex-col items-center">
            <FileQuestion className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">En attente...</p>
          </div>
        </div>
      )
    }

    // Show loading state
    if (shouldShowLoading && !file.imageUrl) {
      return (
        <div className="w-full h-32 sm:h-40 bg-muted flex items-center justify-center min-w-[50px]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">{file.progress}%</p>
          </div>
        </div>
      )
    }

    // Show image if we have a URL or blob and it's an image
    if (shouldShowImage) {
      let imageUrl = file.imageUrl

      // Try to get URL from blob or file only if they are images
      if (!imageUrl) {
        if (
          file.blob &&
          file.blob.type &&
          file.blob.type.startsWith("image/")
        ) {
          imageUrl = URL.createObjectURL(file.blob)
        } else if (
          file.file &&
          typeof file.file !== "string" &&
          (file.file as Blob).type &&
          (file.file as Blob).type.startsWith("image/")
        ) {
          imageUrl = URL.createObjectURL(file.file as Blob)
        }
      }

      // Only render Image component if we have a valid image URL
      if (imageUrl) {
        return (
          <div className="relative w-full h-32 sm:h-40 min-w-[50px]">
            <Image
              src={imageUrl || "/placeholder.svg"}
              alt={file.name}
              fill
              style={{ objectFit: "cover" }}
              className="rounded-md"
              unoptimized // Important to prevent Next.js from optimizing and breaking our blob URLs
            />
          </div>
        )
      }
    }

    // Show file type icon and preview for non-image files
    return (
      <div className="w-full h-32 sm:h-40 bg-muted flex flex-col items-center justify-center min-w-[50px] p-4">
        {getFileIcon(
          file.type ||
            file.blob?.type ||
            "" ||
            (file.file && typeof file.file !== "string"
              ? (file.file as Blob).type || ""
              : ""),
          file.name,
        )}
        {file.preview ? (
          <ScrollArea className="h-full w-full rounded-md mt-2">
            <p className="text-xs text-muted-foreground font-mono p-2">
              {file.preview}
            </p>
          </ScrollArea>
        ) : (
          <span className="text-muted-foreground text-sm sm:text-base mt-2">
            {file.type ||
              file.blob?.type ||
              "" ||
              (file.file && typeof file.file !== "string"
                ? (file.file as Blob).type || ""
                : "") ||
              "Unknown type"}
          </span>
        )}
      </div>
    )
  }

  // Modifier le composant Card pour qu'il ne capture pas les clics
  // Cela permet au clic de remonter jusqu'au parent pour la sélection
  return (
    <Card className="h-full min-w-[50px] group relative pointer-events-auto">
      {/* Original remove button */}
      {onRemove && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute -right-2 -top-2 z-10 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation() // Empêcher la propagation pour éviter la sélection
            onRemove(file.id)
          }}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Remove file</span>
        </Button>
      )}

      {/* New download button (only shown if onDownload is provided) */}
      {onDownload &&
        (file.blob ||
          file.imageUrl ||
          (file.file && typeof file.file !== "string")) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation() // Empêcher la propagation pour éviter la sélection
              onDownload()
            }}
            className="absolute top-2 right-2 h-8 px-2"
          >
            <Download className="h-4 w-4" />
            <span className="sr-only">Download file</span>
          </Button>
        )}

      <CardContent className="p-4 flex flex-col h-full min-w-[50px]">
        {renderPreviewContent()}

        <div className="mt-2 space-y-1">
          <p className="text-sm truncate">{file.name}</p>
          {formatSize && (
            <p className="text-xs text-muted-foreground">
              {formatSize(
                file.size ||
                  file.blob?.size ||
                  (file.file && typeof file.file !== "string"
                    ? (file.file as Blob).size || 0
                    : 0),
              )}
            </p>
          )}
        </div>

        {/* Error state with retry button (only shown if showDownloadProgress and onRetry are provided) */}
        {showDownloadProgress && file.status === "error" && onRetry && (
          <p className="text-xs text-red-500 mt-1">
            Download failed.
            <Button
              variant="link"
              className="p-0 h-auto text-xs"
              onClick={(e) => {
                e.stopPropagation() // Empêcher la propagation pour éviter la sélection
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
