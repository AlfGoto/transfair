"use client"

import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, Download } from "lucide-react"
import JSZip from "jszip"
import type { FileMetadata } from "@/app/[id]/page"
import { FileItem, type FileWithProgress } from "./FileItem"
import { ProgressBar } from "./ui/progress-bar"

const MAX_CONCURRENT_SIZE = 20

// eslint-disable-next-line
const useDeepCompareEffect = (effect: React.EffectCallback, deps: any[]) => {
  // eslint-disable-next-line
  const ref = useRef<any[]>(deps)
  if (!deps.every((val, i) => val === ref.current[i])) {
    ref.current = deps
  }
  useEffect(effect, ref.current)
}

export function FileDownloader({
  filesMetadata,
}: {
  filesMetadata: FileMetadata[]
}) {
  const [files, setFiles] = useState<FileWithProgress[]>([])
  const [selectedFiles, setSelectedFiles] = useState<number[]>([])
  const [isDownloading, setIsDownloading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const downloadInProgress = useRef(false)
  const [isLoading, setIsLoading] = useState(false)
  const progressRefs = useRef<{ progress: number }[]>([])
  const queueLock = useRef(false)

  // Initialize files and clean up object URLs
  useDeepCompareEffect(() => {
    const initialFiles = filesMetadata.map((file) => ({
      ...file,
      progress: 0,
      status: "pending" as const,
    }))
    setFiles(initialFiles)
    setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
    progressRefs.current = filesMetadata.map(() => ({ progress: 0 }))

    return () => {
      initialFiles.forEach((file) => {
        if (file.url) URL.revokeObjectURL(file.url)
      })
    }
  }, [filesMetadata])

  const updateProgress = useCallback((index: number, progress: number) => {
    progressRefs.current[index].progress = progress
    setTimeout(() => {
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? { ...f, progress: progressRefs.current[i].progress }
            : f,
        ),
      )
    }, 100)
  }, [])

  const downloadFile = useCallback(
    async (file: FileWithProgress, index: number) => {
      if (file.status === "downloading" || file.status === "complete") return

      try {
        setFiles((prev) =>
          prev.map((f, i) =>
            i === index ? { ...f, status: "downloading" } : f,
          ),
        )

        const response = await fetch(file.url)
        if (!response.ok) throw new Error(`Failed to fetch ${file.name}`)

        const contentType = response.headers.get("content-type") || ""
        const reader = response.body?.getReader()
        if (!reader) throw new Error("ReadableStream not supported")

        const contentLength =
          Number(response.headers.get("content-length")) || 0
        let receivedLength = 0
        const chunks: Uint8Array[] = []
        let preview = ""
        let previewGenerated = false

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          chunks.push(value)
          receivedLength += value.length

          // Generate preview from first chunk
          if (!previewGenerated && chunks.length === 1) {
            try {
              const decoder = new TextDecoder()
              const chunkText = decoder.decode(value.slice(0, 500))
              preview =
                chunkText.slice(0, 500) + (chunkText.length > 500 ? "..." : "")
              previewGenerated = true
            } catch (e) {
              console.error("Preview generation failed:", e)
            }
          }

          if (contentLength) {
            const progress = Math.round((receivedLength / contentLength) * 100)
            updateProgress(index, progress)
          }
        }

        // Create blob and object URL
        const blob = new Blob(chunks)
        const url = URL.createObjectURL(blob)

        if (file.objectUrl) {
          URL.revokeObjectURL(file.objectUrl)
        }

        setFiles((prev) =>
          prev.map((f, i) =>
            i === index
              ? {
                  ...f,
                  type: contentType,
                  objectUrl: url,
                  progress: 100,
                  status: "complete",
                  preview,
                }
              : f,
          ),
        )

        return { url, preview }
      } catch (error) {
        console.error(`Error downloading file ${file.name}:`, error)
        setFiles((prev) =>
          prev.map((f, i) => (i === index ? { ...f, status: "error" } : f)),
        )
      }
    },
    [updateProgress],
  )

  const startDownloads = useCallback(async (): Promise<void> => {
    if (queueLock.current || files.length === 0) return
    queueLock.current = true

    const maxSizeMB = MAX_CONCURRENT_SIZE
    let inFlightSize = 0 // in MB
    const total = files.length
    let nextIdx = 0

    const downloadQueue = async () => {
      while (nextIdx < total) {
        const file = files[nextIdx]

        if (file.status !== "pending") {
          nextIdx++
          continue
        }

        const sizeMB = (file.size ?? 0) / (1024 * 1024)

        // if adding this file would exceed budget but we already have downloads in flight, pause scheduling
        if (inFlightSize + sizeMB > maxSizeMB && inFlightSize > 0) {
          await new Promise((resolve) => setTimeout(resolve, 100)) // Wait briefly before retrying
          continue
        }

        if (sizeMB > maxSizeMB && inFlightSize > 0) {
          await new Promise((resolve) => setTimeout(resolve, 100)) // Wait briefly before retrying
          continue
        }
        inFlightSize += sizeMB
        const idx = nextIdx++

        try {
          await downloadFile(file, idx)
        } finally {
          inFlightSize -= sizeMB
          // if everything’s done, clear the flag; otherwise try to schedule more
          if (nextIdx >= total && inFlightSize === 0) {
            downloadInProgress.current = false
          }
          queueLock.current = false
        }
      }
    }

    await downloadQueue()
  }, [files, downloadFile])

  useEffect(() => {
    if (files.length > 0) {
      startDownloads()
    }
  }, [files.length, startDownloads])

  useEffect(() => {
    return () => {
      // Clean up all object URLs when component unmounts
      files.forEach((file) => {
        if (file.objectUrl) {
          URL.revokeObjectURL(file.objectUrl)
        }
      })
      downloadInProgress.current = false
    }
  }, [files])

  const toggleFileSelection = useCallback((index: number) => {
    setSelectedFiles((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    )
  }, [])

  const downloadSingleFile = useCallback(async (file: FileWithProgress) => {
    if (!file.url) {
      // If URL was revoked, re-fetch the file
      const response = await fetch(file.url)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = file.name
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const a = document.createElement("a")
      a.href = file.url
      a.download = file.name
      a.click()
    }
  }, [])

  const downloadSelectedFiles = async () => {
    setIsDownloading(true)
    try {
      const selectedFilesData = files.filter((_, index) =>
        selectedFiles.includes(index),
      )

      if (selectedFilesData.length === 1) {
        await downloadSingleFile(selectedFilesData[0])
        return
      }

      const zip = new JSZip()
      const folderName = selectedFilesData[0]?.name.split(".")[0] || "download"

      await Promise.all(
        selectedFilesData.map(async (file) => {
          if (!file.url) {
            const response = await fetch(file.url)
            const blob = await response.blob()
            return { file, blob }
          }
          const blob = await fetch(file.url).then((res) => res.blob())
          return { file, blob }
        }),
      ).then((files) => {
        files.forEach(({ file, blob }) => {
          zip.file(file.name, blob)
        })
      })

      const zipBlob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${folderName}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading files:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  const downloadAllFiles = async () => {
    setIsDownloading(true)
    try {
      if (files.length === 1) {
        await downloadSingleFile(files[0])
        return
      }

      const zip = new JSZip()
      const folderName = files[0]?.name.split(".")[0] || "download"

      await Promise.all(
        files.map(async (file) => {
          if (!file.url) {
            const response = await fetch(file.url)
            const blob = await response.blob()
            return { file, blob }
          }
          const blob = await fetch(file.url).then((res) => res.blob())
          return { file, blob }
        }),
      ).then((files) => {
        files.forEach(({ file, blob }) => {
          zip.file(file.name, blob)
        })
      })

      const zipBlob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${folderName}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading files:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleRetry = useCallback(
    (file: FileWithProgress, index: number) => {
      downloadFile(file, index)
    },
    [downloadFile],
  )

  const shareAllImages = async () => {
    setIsLoading(true)
    try {
      const imageFilesData = files.filter(
        (file) =>
          file.objectUrl &&
          file.status === "complete" &&
          file.type &&
          file.type.startsWith("image/"),
      )

      if (imageFilesData.length === 0) {
        console.warn("No images to share.")
        setIsLoading(false)
        return
      }

      const shareFiles = imageFilesData.map(
        (file) => new File([file.objectUrl!], file.name, { type: file.type }),
      )

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: shareFiles })
      ) {
        try {
          await navigator.share({
            files: shareFiles,
            title: "Share my images",
            text: "Here are all my camera images!",
          })
        } catch (error) {
          console.error("Error sharing images:", error)
        }
      } else {
        console.warn("File sharing not supported on this device.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const { totalProgress, totalProgressBuffer, showProgressBar } =
    useMemo(() => {
      if (files.length === 0) {
        return {
          totalProgress: 0,
          totalProgressBuffer: 0,
          showProgressBar: false,
        }
      }

      const total = files.reduce((sum, file) => sum + file.progress, 0)
      const activeCount = files.filter((f) => f.progress !== 0).length
      const totalProgress = (total / (files.length * 100)) * 100

      return {
        totalProgress,
        totalProgressBuffer: (activeCount / files.length) * 100,
        showProgressBar: totalProgress < 100,
      }
    }, [files])

  const memoizedFiles = useMemo(
    () =>
      files.map((file, index) => (
        <FileItem
          key={file.id}
          file={file}
          index={index}
          isSelected={selectedFiles.includes(index)}
          onToggleSelect={toggleFileSelection}
          onDownloadSingle={downloadSingleFile}
          onRetry={handleRetry}
        />
      )),
    [
      files,
      selectedFiles,
      toggleFileSelection,
      downloadSingleFile,
      handleRetry,
    ],
  )

  if (isDownloading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-12 w-full">
        <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 animate-spin mb-4" />
        <h2 className="text-xl sm:text-2xl font-bold mb-2">
          Preparing Download
        </h2>
        <p className="text-muted-foreground text-center mb-4">
          Please wait while your files are being prepared...
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <h1 className="text-2xl font-bold mb-4">Download Files</h1>
      {showProgressBar ? (
        <ProgressBar
          value={totalProgress}
          bufferValue={totalProgressBuffer}
          text={"Files downloading..."}
          color="bg-zinc-800"
          bufferColor="bg-zinc-400"
          className="my-5"
        />
      ) : (
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <Button
            onClick={downloadAllFiles}
            disabled={files.length === 0 || files.every((f) => !f.objectUrl)}
            className="w-full sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            Download All Files
          </Button>
          <Button
            onClick={downloadSelectedFiles}
            disabled={
              selectedFiles.length === 0 ||
              selectedFiles.every((index) => !files[index]?.objectUrl)
            }
            className="w-full sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Selected Files
          </Button>

          {isMobile &&
            files.some((file) => file?.type?.startsWith("image/")) && (
              <Button
                onClick={shareAllImages}
                className="w-full sm:w-auto"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {isLoading ? "Loading..." : "Save Images"}
              </Button>
            )}
        </div>
      )}

      <div className="mt-6">
        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 gap-4">
          {memoizedFiles}
        </div>
      </div>
      <Button
        onClick={() => router.push("/")}
        className="mt-6 w-full sm:w-auto"
      >
        Upload More Files
      </Button>
    </div>
  )
}
