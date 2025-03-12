"use client";

import { memo, useState, useRef, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { FilePreview } from "./FilePreview";
import type { FileMetadata } from "@/app/[id]/page";

interface FileWithProgress extends FileMetadata {
  blob?: Blob;
  progress: number;
  status: "pending" | "downloading" | "complete" | "error";
  preview?: string;
}

interface FileItemProps {
  file: FileWithProgress;
  index: number;
  isSelected: boolean;
  onToggleSelect: (index: number) => void;
  onDownloadSingle: (file: FileWithProgress) => void;
  onRetry: (file: FileWithProgress, index: number) => void;
  formatSize: (size: number) => string;
}

// Create a stable object URL that persists between renders
const objectUrlCache = new Map<string, string>();

function getObjectUrl(file: FileWithProgress): string | null {
  if (!file.blob) return null;

  const cacheKey = `${file.id}-${file.blob.size}-${file.blob.type}`;

  if (objectUrlCache.has(cacheKey)) {
    return objectUrlCache.get(cacheKey) || null;
  }

  const url = URL.createObjectURL(file.blob);
  objectUrlCache.set(cacheKey, url);
  return url;
}

// The FileItem component is memoized to prevent unnecessary re-renders
const FileItem = memo(
  function FileItem({
    file,
    index,
    isSelected,
    onToggleSelect,
    onDownloadSingle,
    onRetry,
    formatSize,
  }: FileItemProps) {
    // Store the object URL in a ref to prevent it from changing between renders
    const objectUrlRef = useRef<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Get or create the object URL once when the blob is available
    useEffect(() => {
      if (file.blob && !objectUrlRef.current) {
        objectUrlRef.current = getObjectUrl(file);
        setIsLoaded(true);
      }
    }, [file.blob, file.id, getObjectUrl]);

    // Create a stable file object that won't change unless necessary properties change
    const stableFile = {
      id: file.id,
      name: file.name,
      type: file.type,
      size: file.blob?.size,
      preview: file.preview,
      status: file.status,
      progress: file.progress,
      // Only include the blob reference if we're still downloading
      // This prevents re-renders once the file is complete
      blob: file.status === "complete" && isLoaded ? undefined : file.blob,
      // Add a stable URL property that won't change between renders
      url: objectUrlRef.current,
    };

    return (
      <div className="relative">
        <div
          className="absolute top-6 left-6 z-10 dark:bg-gray-800 rounded-md p-1"
          onClick={(e) => e.stopPropagation()} // Empêcher la propagation pour éviter les doubles clics
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
              // For image display, we need to provide a stable URL that won't change
              imageUrl: objectUrlRef.current,
            }}
            onDownload={() => onDownloadSingle(file)}
            onRetry={() => onRetry(file, index)}
            formatSize={formatSize}
            showDownloadProgress={true}
          />
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function to prevent unnecessary re-renders
    // Only re-render if these specific properties change
    return (
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.file.status === nextProps.file.status &&
      prevProps.file.progress === nextProps.file.progress &&
      // Once a file is complete, we don't need to re-render it anymore
      prevProps.file.status === "complete" &&
      nextProps.file.status === "complete"
    );
  }
);

export { FileItem, type FileWithProgress };
