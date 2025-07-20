"use client";

import { memo, useRef, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { FileMetadata } from "@/app/[locale]/[id]/page";
import { Button } from "./ui/button";
import { Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { Progress } from "./ui/progress";
import { useTranslations } from "next-intl";

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
  }: FileItemProps) {
    const tCommon = useTranslations("common");
    // Store the object URL in a ref to prevent it from changing between renders
    const objectUrlRef = useRef<string | null>(null);

    // Get or create the object URL once when the blob is available
    useEffect(() => {
      if (file.blob && !objectUrlRef.current) {
        objectUrlRef.current = getObjectUrl(file);
      }

      // Cleanup function to revoke object URL when component unmounts
      // or when file/blob changes
      return () => {
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }
      };
    }, [file]);

    return (
      <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <div className="flex-shrink-0">
          <Checkbox
            id={`file-${file.id}`}
            className={isSelected ? "bg-primary border-none" : ""}
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(index)}
          />
        </div>

        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{file.name}</span>
            {file.status === "error" && (
              <AlertCircle className="w-4 h-4 text-[hsl(var(--destructive))] flex-shrink-0" />
            )}
            {file.status === "complete" && (
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            )}
          </div>

          {file.status === "downloading" && (
            <div className="mt-2">
              <Progress value={file.progress} className="h-1" />
            </div>
          )}
        </div>

        <div className="flex-shrink-0">
          {file.status === "error" ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRetry(file, index)}
              className="text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))]/90"
            >
              {tCommon("retry")}
            </Button>
          ) : file.status === "complete" ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDownloadSingle(file)}
              className="text-primary hover:text-primary/90"
            >
              <Download className="w-4 h-4" />
            </Button>
          ) : null}
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
