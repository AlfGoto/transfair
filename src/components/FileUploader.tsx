"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, AlertCircle, Clipboard, Check, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSession } from "next-auth/react";
import { formatSize, isTextFile, readTextFile } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  file: File;
  preview?: string;
}

interface FileUploaderProps {
  apiUrl: string;
}

const MAX_SIZE = 2 * 1024 * 1024 * 1024;
const TEXT_PREVIEW_LENGTH = 200;

export function FileUploader({ apiUrl }: FileUploaderProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const t = useTranslations("fileUploader");
  const tCommon = useTranslations("common");

  const totalSize = files.reduce((acc, file) => acc + file.size, 0);
  const isOverLimit = totalSize > MAX_SIZE;

  const handleFiles = useCallback(async (newFiles: FileList | File[]) => {
    const filePromises = Array.from(newFiles).map(async (file) => {
      const fileItem: FileItem = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size,
        file: file,
      };

      if (isTextFile(file)) {
        try {
          fileItem.preview = await readTextFile(file, TEXT_PREVIEW_LENGTH);
        } catch (error) {
          console.error("Error reading text file:", error);
        }
      }

      return fileItem;
    });

    const processedFiles = await Promise.all(filePromises);

    setFiles((prevFiles) => {
      const updatedFiles = [...prevFiles, ...processedFiles];
      const newTotalSize = updatedFiles.reduce(
        (acc, file) => acc + file.size,
        0
      );

      if (newTotalSize > MAX_SIZE) {
        setError(t("totalSizeExceeded"));
      } else {
        setError(null);
      }

      return updatedFiles;
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prevFiles) => {
      const updatedFiles = prevFiles.filter((file) => file.id !== id);
      const newTotalSize = updatedFiles.reduce(
        (acc, file) => acc + file.size,
        0
      );
      if (newTotalSize <= MAX_SIZE) {
        setError(null);
      }
      return updatedFiles;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0 || isOverLimit) return;
    setIsUploading(true);
    setId(null);
    setError(null);

    try {
      const filesJson = JSON.stringify(
        files.map((file) => ({ name: file.name, type: file.type }))
      );
      console.log(filesJson);

      const myHeaders = new Headers();
      if (session?.token) myHeaders.append("credentials", session?.token);
      myHeaders.append("Content-Type", "application/json");

      const res = await fetch(apiUrl, {
        body: filesJson,
        method: "POST",
        credentials: "include",
        headers: myHeaders,
      });
      const { urls, id } = await res.json();

      await Promise.all(
        files.map(async (file) => {
          const fileInfo = urls.find(
            (item: (typeof urls)[0]) => item.filename === file.name
          );

          try {
            const blob =
              file instanceof Blob
                ? file
                : new Blob([file.file], { type: file.type });
            const uploadResponse = await fetch(fileInfo.uploadUrl, {
              method: "PUT",
              body: blob,
              headers: {
                "Content-Type": file.type,
                "Content-Length": file.size.toString(),
              },
            });

            if (!uploadResponse.ok) {
              throw new Error(`Upload failed: ${uploadResponse.status}`);
            }
          } catch (error) {
            console.error("Upload failed for", file.name, error);
            return { success: false, filename: file.name };
          }
        })
      );
      setId(id);
      setFiles([]);

      return;
    } catch (error) {
      setError("Failed to send files. Please try again.");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = async () => {
    if (id) {
      // Create clean URL without locale prefix
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      // Ensure base URL ends with "/" before appending the ID
      const linkToCopy = baseUrl.endsWith("/")
        ? `${baseUrl}${id}`
        : `${baseUrl}/${id}`;
      try {
        await navigator.clipboard.writeText(linkToCopy);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy text: ", err);
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <div
        className={`border-2 border-dashed rounded-lg p-8 mb-6 transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center gap-4">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm text-muted-foreground text-center">
              {t("dragAndDrop")}
            </p>
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              multiple
              className="w-full max-w-xs"
            />
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row gap-4 sm:items-center mb-6">
        <div className="flex-1">
          <p
            className={`text-sm ${
              isOverLimit ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {totalSize !== 0 &&
              `${t("totalSize")} : ${formatSize(totalSize, tCommon)} / 2Go`}
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || isUploading || isOverLimit}
            className="w-full sm:w-auto min-w-[120px]"
          >
            {isUploading ? tCommon("sending") : tCommon("send")}
          </Button>
        </div>
      </div>

      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{file.name}</span>
                  <span className="text-sm text-muted-foreground">
                    ({formatSize(file.size, tCommon)})
                  </span>
                </div>
                {file.preview && (
                  <p className="text-sm text-muted-foreground mt-1 truncate">
                    {file.preview}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeFile(file.id)}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {id && (
        <div className="mt-6">
          <Alert>
            <div className="flex items-center gap-4">
              <div className="flex-grow">
                <AlertDescription>{t("filesReadyToShare")}</AlertDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0"
                onClick={copyToClipboard}
              >
                {isCopied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Clipboard className="h-4 w-4" />
                )}
                <span className="ml-2">
                  {isCopied ? tCommon("copied") : tCommon("copy")}
                </span>
              </Button>
            </div>
          </Alert>
        </div>
      )}
    </div>
  );
}
