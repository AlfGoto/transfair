"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Loader2, Download, Share } from "lucide-react";
import JSZip from "jszip";
import { FilePreview } from "./FilePreview";
import type { FileMetadata } from "@/app/[id]/page";

interface FileWithProgress extends FileMetadata {
  blob?: Blob;
  progress: number;
  status: "pending" | "downloading" | "complete" | "error";
  preview?: string; // For text files
}

export function FileDownloader({
  filesMetadata,
}: {
  filesMetadata: FileMetadata[];
}) {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [totalProgress, setTotalProgress] = useState(0);
  const router = useRouter();
  const objectUrls = useRef<string[]>([]);

  // Initialize files with progress tracking
  useEffect(() => {
    setFiles(
      filesMetadata.map((file) => ({
        ...file,
        progress: 0,
        status: "pending",
      }))
    );

    setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

    return () => {
      // Clean up object URLs to prevent memory leaks
      objectUrls.current.forEach(URL.revokeObjectURL);
      objectUrls.current = [];
    };
  }, [filesMetadata]);

  // Start downloading all files immediately
  useEffect(() => {
    const downloadAllFiles = async () => {
      // Download files in parallel
      await Promise.all(files.map((file, index) => downloadFile(file, index)));
    };

    if (files.length > 0) {
      downloadAllFiles();
    }
  }, [files.length]); // Only run when files array is first populated

  const toggleFileSelection = (index: number) => {
    setSelectedFiles((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const downloadFile = async (file: FileWithProgress, index: number) => {
    if (file.status === "downloading" || file.status === "complete")
      return null;

    try {
      // Update file status
      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, status: "downloading" } : f))
      );

      // Fetch with progress tracking
      const response = await fetch(file.url);

      if (!response.ok) throw new Error(`Failed to fetch ${file.name}`);

      const contentLength = Number(response.headers.get("content-length")) || 0;
      const contentType = response.headers.get("content-type") || "";
      const reader = response.body?.getReader();

      if (!reader) throw new Error("ReadableStream not supported");

      let receivedLength = 0;
      const chunks: Uint8Array[] = [];

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        // Calculate progress percentage
        const progress = contentLength
          ? Math.round((receivedLength / contentLength) * 100)
          : 0;

        // Update file progress
        setFiles((prev) =>
          prev.map((f, i) => (i === index ? { ...f, progress } : f))
        );

        // Update total progress
        updateTotalProgress();
      }

      // Combine chunks into a single Uint8Array
      const chunksAll = new Uint8Array(receivedLength);
      let position = 0;
      for (const chunk of chunks) {
        chunksAll.set(chunk, position);
        position += chunk.length;
      }

      // Create blob from the downloaded data
      const blob = new Blob([chunksAll], {
        type: contentType || file.type || "application/octet-stream",
      });

      // Generate preview for text files
      let preview: string | undefined = undefined;
      if (
        blob.type.startsWith("text/") ||
        blob.type.includes("json") ||
        /\.(md|txt|csv|xml|yml|yaml|json|js|ts|html|css)$/i.test(file.name)
      ) {
        try {
          const text = await blob.text();
          preview = text.slice(0, 500) + (text.length > 500 ? "..." : "");
        } catch (e) {
          console.error("Failed to generate preview:", e);
        }
      }

      // Update file with blob, type, and status
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? {
                ...f,
                blob,
                type: blob.type,
                progress: 100,
                status: "complete",
                preview,
              }
            : f
        )
      );

      return blob;
    } catch (error) {
      console.error(`Error downloading file ${file.name}:`, error);

      // Update file status to error
      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, status: "error" } : f))
      );

      return null;
    }
  };

  const updateTotalProgress = () => {
    const totalProgress =
      files.reduce((sum, file) => sum + file.progress, 0) / files.length;
    setTotalProgress(Math.round(totalProgress));
  };

  const downloadSingleFile = (file: FileWithProgress) => {
    if (!file.blob) return;

    const url = URL.createObjectURL(file.blob);
    objectUrls.current.push(url);

    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
  };

  const downloadSelectedFiles = async () => {
    setIsDownloading(true);

    try {
      const selectedFilesData = files.filter((_, index) =>
        selectedFiles.includes(index)
      );

      if (selectedFilesData.length === 1) {
        // If only one file is selected, download it directly
        downloadSingleFile(selectedFilesData[0]);
        setIsDownloading(false);
        return;
      }

      const zip = new JSZip();
      const folderName = selectedFilesData[0]?.name.split(".")[0] || "download";
      const folder = zip.folder(folderName);

      if (!folder) {
        console.error("Failed to create folder in zip");
        setIsDownloading(false);
        return;
      }

      // Add all selected files to the zip
      for (const file of selectedFilesData) {
        if (!file.blob) continue;
        folder.file(file.name, await file.blob.arrayBuffer());
      }

      // Generate and download the zip file
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      const zipUrl = window.URL.createObjectURL(zipBlob);
      objectUrls.current.push(zipUrl);

      const a = document.createElement("a");
      a.style.display = "none";
      a.href = zipUrl;
      a.download = `${folderName}.zip`;
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading files:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadAllFiles = async () => {
    setIsDownloading(true);

    try {
      if (files.length === 1) {
        // If only one file, download it directly
        downloadSingleFile(files[0]);
        setIsDownloading(false);
        return;
      }

      const zip = new JSZip();
      const folderName = files[0]?.name.split(".")[0] || "download";
      const folder = zip.folder(folderName);

      if (!folder) {
        console.error("Failed to create folder in zip");
        setIsDownloading(false);
        return;
      }

      // Add all files to the zip
      for (const file of files) {
        if (!file.blob) continue;
        folder.file(file.name, await file.blob.arrayBuffer());
      }

      // Generate and download the zip file
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      const zipUrl = window.URL.createObjectURL(zipBlob);
      objectUrls.current.push(zipUrl);

      const a = document.createElement("a");
      a.style.display = "none";
      a.href = zipUrl;
      a.download = `${folderName}.zip`;
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading files:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatSize = (size: number): string => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024)
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  async function shareImages() {
    // Get all image files that are ready to share
    const filesToShare = files
      .filter(
        (file, index) =>
          selectedFiles.includes(index) &&
          file.blob &&
          file.status === "complete" &&
          file.blob.type.startsWith("image/")
      )
      .map((file) => {
        if (!file.blob) return null;
        return new File([file.blob], file.name, {
          type: file.blob.type,
        });
      })
      .filter(Boolean) as File[];

    if (filesToShare.length === 0) {
      console.warn("No images to share.");
      return;
    }

    try {
      const shareData = {
        files: filesToShare,
        title: "Shared Images",
        text: "Here are some images I'd like to share!",
      };

      await navigator.share(shareData);
      console.log("Images shared successfully!");
    } catch (error) {
      console.error("Error sharing images:", error);
    }
  }

  if (isDownloading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-12">
        <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 animate-spin mb-4" />
        <h2 className="text-xl sm:text-2xl font-bold mb-2">
          Preparing Download
        </h2>
        <p className="text-muted-foreground text-center mb-4">
          Please wait while your files are being prepared...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <h1 className="text-2xl font-bold mb-4">Download Files</h1>
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <Button
          onClick={downloadAllFiles}
          disabled={files.length === 0 || files.every((f) => !f.blob)}
          className="w-full sm:w-auto"
        >
          <Download className="mr-2 h-4 w-4" />
          Download All Files
        </Button>
        <Button
          onClick={downloadSelectedFiles}
          disabled={
            selectedFiles.length === 0 ||
            selectedFiles.every((index) => !files[index]?.blob)
          }
          className="w-full sm:w-auto"
        >
          <Download className="mr-2 h-4 w-4" />
          Download Selected Files
        </Button>
        {isMobile &&
          navigator.share &&
          files.some((file) => file.blob?.type?.startsWith("image/")) && (
            <Button
              onClick={shareImages}
              className="w-full sm:w-auto"
              disabled={selectedFiles.length === 0}
            >
              <Share className="mr-2 h-4 w-4" />
              Share Selected Images
            </Button>
          )}
      </div>

      {/* Overall progress */}
      {totalProgress > 0 && totalProgress < 100 && (
        <div className="mt-4">
          <p className="text-sm font-medium mb-1">Overall Progress</p>
          <Progress value={totalProgress} className="h-2" />
          <p className="text-xs text-right mt-1">{totalProgress}%</p>
        </div>
      )}

      <div className="mt-6">
        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 gap-4">
          {files.map((file, index) => (
            <div key={file.id} className="relative">
              <Checkbox
                id={`file-${file.id}`}
                checked={selectedFiles.includes(index)}
                onCheckedChange={() => toggleFileSelection(index)}
                className="absolute top-6 left-6 z-10"
              />
              <FilePreview
                file={file}
                onDownload={() => downloadSingleFile(file)}
                onRetry={() => downloadFile(file, index)}
                formatSize={formatSize}
                showDownloadProgress={true}
              />
            </div>
          ))}
        </div>
      </div>
      <Button
        onClick={() => router.push("/")}
        className="mt-6 w-full sm:w-auto"
      >
        Upload More Files
      </Button>
    </div>
  );
}
