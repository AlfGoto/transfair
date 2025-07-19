"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Loader2, Download } from "lucide-react";
import JSZip from "jszip";
import type { FileMetadata } from "@/app/[locale]/[id]/page";
import { FileItem, type FileWithProgress } from "./FileItem";
import { ProgressBar } from "./ui/progress-bar";
import { useTranslations } from "next-intl";

export function FileDownloader({
  filesMetadata,
}: {
  filesMetadata: FileMetadata[];
}) {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const downloadInProgress = useRef(false);
  const progressRefs = useRef<{ progress: number }[]>([]);
  const t = useTranslations("fileDownloader");
  const tCommon = useTranslations("common");

  // Initialize files and check for mobile device
  useEffect(() => {
    setFiles(
      filesMetadata.map((file) => ({
        ...file,
        progress: 0,
        status: "pending",
      }))
    );
    setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    progressRefs.current = filesMetadata.map(() => ({ progress: 0 }));
  }, [filesMetadata]);

  // Throttled progress updates
  const updateProgress = useCallback((index: number, progress: number) => {
    progressRefs.current[index].progress = progress;
    // Batch updates every 100ms
    setTimeout(() => {
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, progress: progressRefs.current[i].progress } : f
        )
      );
    }, 100);
  }, []);

  // Download handler
  const downloadFile = useCallback(
    async (file: FileWithProgress, index: number) => {
      if (file.status === "downloading" || file.status === "complete")
        return null;

      try {
        setFiles((prev) =>
          prev.map((f, i) =>
            i === index ? { ...f, status: "downloading" } : f
          )
        );

        const response = await fetch(file.url);
        if (!response.ok) throw new Error(`Failed to fetch ${file.name}`);

        const contentLength =
          Number(response.headers.get("content-length")) || 0;
        const contentType = response.headers.get("content-type") || "";
        const reader = response.body?.getReader();

        if (!reader) throw new Error("ReadableStream not supported");

        let receivedLength = 0;
        const chunks: Uint8Array[] = [];
        let lastReportedProgress = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          chunks.push(value);
          receivedLength += value.length;

          if (contentLength) {
            const progress = Math.round((receivedLength / contentLength) * 100);
            // Only update progress if it's increased by at least 10%
            if (progress >= lastReportedProgress + 10 || progress === 100) {
              updateProgress(index, progress);
              lastReportedProgress = progress;
            }
          }
        }

        const chunksAll = new Uint8Array(receivedLength);
        let position = 0;
        for (const chunk of chunks) {
          chunksAll.set(chunk, position);
          position += chunk.length;
        }

        const blob = new Blob([chunksAll], {
          type: contentType || file.type || "application/octet-stream",
        });

        setFiles((prev) =>
          prev.map((f, i) =>
            i === index
              ? {
                  ...f,
                  blob,
                  type: blob.type,
                  progress: 100,
                  status: "complete",
                }
              : f
          )
        );

        return blob;
      } catch (error) {
        console.error(`Error downloading file ${file.name}:`, error);
        setFiles((prev) =>
          prev.map((f, i) => (i === index ? { ...f, status: "error" } : f))
        );
        return null;
      }
    },
    [updateProgress]
  );

  // Download scheduler
  const startDownloads = useCallback(() => {
    if (downloadInProgress.current || files.length === 0) return;

    downloadInProgress.current = true;
    let inFlight = 0;
    let nextIdx = 0;
    const total = files.length;

    const schedule = () => {
      if (!downloadInProgress.current) return;

      while (inFlight < 3 && nextIdx < total) {
        const idx = nextIdx++;
        const file = files[idx];

        inFlight++;
        downloadFile(file, idx).finally(() => {
          inFlight--;
          if (inFlight === 0 && nextIdx >= total) {
            downloadInProgress.current = false;
          } else {
            schedule();
          }
        });
      }
    };

    schedule();
  }, [files, downloadFile]);

  // Trigger downloads once when files are ready
  useEffect(() => {
    if (files.length > 0 && !downloadInProgress.current) {
      startDownloads();
    }
  }, [files.length, startDownloads]);

  const toggleFileSelection = useCallback((index: number) => {
    setSelectedFiles((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }, []);

  const downloadSingleFile = useCallback(
    async (file: FileWithProgress) => {
      if (!file.blob) return;

      if (isMobile && navigator.share && file.blob.type.startsWith("image/")) {
        try {
          setIsDownloading(true);
          await navigator.share({
            files: [new File([file.blob], file.name, { type: file.blob.type })],
            title: t("shareFile"),
            text: t("shareYourFile"),
          });
        } catch (error) {
          console.error("Error sharing:", error);
          // Fallback to regular download if sharing fails
          const url = URL.createObjectURL(file.blob);
          const a = document.createElement("a");
          a.style.display = "none";
          a.href = url;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 5000);
        } finally {
          setIsDownloading(false);
        }
      } else {
        const url = URL.createObjectURL(file.blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
    },
    [isMobile, t]
  );

  const downloadSelectedFiles = async () => {
    setIsDownloading(true);
    try {
      const selectedFilesData = files.filter((_, index) =>
        selectedFiles.includes(index)
      );

      if (selectedFilesData.length === 1) {
        await downloadSingleFile(selectedFilesData[0]);
        setIsDownloading(false);
        return;
      }

      if (
        isMobile &&
        navigator.share &&
        selectedFilesData.every((file) => file.blob?.type.startsWith("image/"))
      ) {
        try {
          const fileList = selectedFilesData
            .filter((file) => file.blob)
            .map(
              (file) =>
                new File([file.blob!], file.name, { type: file.blob!.type })
            );

          await navigator.share({
            files: fileList,
            title: "Share files",
            text: "Share your files",
          });
        } catch (error) {
          console.error("Error sharing:", error);
          // Fallback to zip download
          await downloadAsZip(selectedFilesData);
        }
      } else {
        await downloadAsZip(selectedFilesData);
      }
    } catch (error) {
      console.error("Error downloading files:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadAllFiles = async () => {
    setIsDownloading(true);
    try {
      if (
        isMobile &&
        navigator.share &&
        files.every((file) => file.blob?.type.startsWith("image/"))
      ) {
        try {
          const fileList = files
            .filter((file) => file.blob)
            .map(
              (file) =>
                new File([file.blob!], file.name, { type: file.blob!.type })
            );

          await navigator.share({
            files: fileList,
            title: t("shareFiles"),
            text: t("shareYourFiles"),
          });
        } catch (error) {
          console.error("Error sharing:", error);
          // Fallback to zip download
          await downloadAsZip(files);
        }
      } else {
        await downloadAsZip(files);
      }
    } catch (error) {
      console.error("Error downloading files:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadAsZip = async (filesToDownload: FileWithProgress[]) => {
    const zip = new JSZip();
    const folderName = filesToDownload[0]?.name.split(".")[0] || "download";
    const folder = zip.folder(folderName);

    if (!folder) {
      console.error("Failed to create folder in zip");
      return;
    }

    for (const file of filesToDownload) {
      if (!file.blob) continue;
      folder.file(file.name, await file.blob.arrayBuffer());
    }

    const zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `${folderName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const { totalProgress, totalProgressBuffer, showProgressBar } =
    useMemo(() => {
      if (files.length === 0) {
        return {
          totalProgress: 0,
          totalProgressBuffer: 0,
          showProgressBar: false,
        };
      }

      const total = files.reduce((acc, file) => acc + file.progress, 0);
      const progress = Math.round(total / files.length);

      return {
        totalProgress: progress,
        totalProgressBuffer: progress + 10,
        showProgressBar: progress > 0 && progress < 100,
      };
    }, [files]);

  if (isDownloading) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[50vh] py-12">
        <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 animate-spin mb-4" />
        <h2 className="text-xl sm:text-2xl font-bold mb-2">
          {isMobile ? t("preparingShare") : t("preparingDownload")}
        </h2>
        <p className="text-muted-foreground text-center mb-4">
          {t("preparingMessage")}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <h1 className="text-2xl font-bold mb-4">{tCommon("downloadFiles")}</h1>
      {showProgressBar ? (
        <ProgressBar
          value={totalProgress}
          bufferValue={totalProgressBuffer}
          text={t("filesDownloading")}
          color="bg-zinc-800"
          bufferColor="bg-zinc-400"
          className="my-5"
        />
      ) : (
        <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSelectedFiles(
                    selectedFiles.length === files.length
                      ? []
                      : files.map((_, i) => i)
                  )
                }
              >
                {selectedFiles.length === files.length
                  ? t("deselectAll")
                  : t("selectAll")}
              </Button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {selectedFiles.length} {t("selected")}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Download All Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={downloadAllFiles}
                disabled={files.length === 0 || files.every((f) => !f.blob)}
              >
                <Download className="mr-2 h-4 w-4" />
                {t("downloadAll")}
              </Button>

              {/* Download Selected Button */}
              {selectedFiles.length > 0 && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={downloadSelectedFiles}
                  disabled={
                    isDownloading ||
                    selectedFiles.every((index) => !files[index]?.blob)
                  }
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {tCommon("downloading")}
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      {t("downloadSelected")}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {files.map((file, index) => (
              <FileItem
                key={file.id}
                file={file}
                index={index}
                isSelected={selectedFiles.includes(index)}
                onToggleSelect={toggleFileSelection}
                onDownloadSingle={downloadSingleFile}
                onRetry={downloadFile}
              />
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={() => router.push("/")}
        className="mt-6 w-full sm:w-auto"
      >
        {tCommon("uploadMoreFiles")}
      </Button>
    </div>
  );
}
