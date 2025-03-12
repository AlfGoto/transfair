"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Download } from "lucide-react";
import JSZip from "jszip";
import type { FileMetadata } from "@/app/[id]/page";
import { FileItem, type FileWithProgress } from "./FileItem";

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
  const downloadInProgress = useRef(false);

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
  }, [filesMetadata]);

  // Start downloading all files immediately
  useEffect(() => {
    const downloadAllFiles = async () => {
      if (downloadInProgress.current) return;
      downloadInProgress.current = true;

      try {
        // Download files in parallel with a limit of 3 concurrent downloads
        const chunks = [];
        const chunkSize = 3; // Number of concurrent downloads

        for (let i = 0; i < files.length; i += chunkSize) {
          const chunk = files.slice(i, i + chunkSize);
          chunks.push(chunk);
        }

        for (const chunk of chunks) {
          await Promise.all(
            chunk.map((file) => {
              const fileIndex = files.findIndex((f) => f.id === file.id);
              return downloadFile(file, fileIndex);
            })
          );
        }
      } finally {
        downloadInProgress.current = false;
      }
    };

    if (files.length > 0 && !downloadInProgress.current) {
      downloadAllFiles();
    }
  }, [files.length]); // Only run when files array is first populated

  const toggleFileSelection = useCallback((index: number) => {
    setSelectedFiles((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }, []);

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

  const downloadSingleFile = useCallback((file: FileWithProgress) => {
    if (!file.blob) return;

    const url = URL.createObjectURL(file.blob);

    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);

    // We don't revoke the URL immediately to prevent issues with download
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, []);

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

      const zipUrl = URL.createObjectURL(zipBlob);

      const a = document.createElement("a");
      a.style.display = "none";
      a.href = zipUrl;
      a.download = `${folderName}.zip`;
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);

      // Revoke URL after a delay to ensure download starts
      setTimeout(() => URL.revokeObjectURL(zipUrl), 5000);
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

      const zipUrl = URL.createObjectURL(zipBlob);

      const a = document.createElement("a");
      a.style.display = "none";
      a.href = zipUrl;
      a.download = `${folderName}.zip`;
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);

      // Revoke URL after a delay to ensure download starts
      setTimeout(() => URL.revokeObjectURL(zipUrl), 5000);
    } catch (error) {
      console.error("Error downloading files:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatSize = useCallback((size: number): string => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024)
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }, []);

  const handleRetry = useCallback((file: FileWithProgress, index: number) => {
    downloadFile(file, index);
  }, []);

  const shareAllImages = async () => {
    // Filtrer tous les fichiers qui sont des images terminées
    const imageFilesData = files.filter(
      (file) =>
        file.blob &&
        file.status === "complete" &&
        file.type &&
        file.type.startsWith("image/")
    );

    if (imageFilesData.length === 0) {
      console.warn("Aucune image à partager.");
      return;
    }

    // Créer un tableau d'objets File pour le partage
    const shareFiles = imageFilesData.map(
      (file) => new File([file.blob!], file.name, { type: file.type })
    );

    // Vérifier si la fonction de partage de fichiers est disponible sur l'appareil
    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: shareFiles })
    ) {
      try {
        await navigator.share({
          files: shareFiles,
          title: "Partager mes images",
          text: "Voici toutes les images de ma caméra !",
        });
      } catch (error) {
        console.error("Erreur lors du partage des images :", error);
      }
    } else {
      console.warn(
        "Le partage de fichiers n'est pas supporté sur cet appareil."
      );
    }
  };

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
          files.some((file) => file.blob?.type?.startsWith("image/")) && (
            <Button onClick={shareAllImages} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Save Images
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
            <FileItem
              key={file.id}
              file={file}
              index={index}
              isSelected={selectedFiles.includes(index)}
              onToggleSelect={toggleFileSelection}
              onDownloadSingle={downloadSingleFile}
              onRetry={handleRetry}
              formatSize={formatSize}
            />
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
