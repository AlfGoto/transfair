"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import JSZip from "jszip";
import type { FileItem } from "@/app/[id]/page";

export function FileDownloader({ initialFiles }: { initialFiles: FileItem[] }) {
  const [files, setFiles] = useState<(FileItem & { blob?: Blob })[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const objectUrls = useRef<string[]>([]);

  // Convert base64 to Blobs when component mounts
  useEffect(() => {
    const convertBase64ToBlobs = async () => {
      setIsLoading(true);
      try {
        const filesWithBlobs = await Promise.all(
          initialFiles.map(async (file) => {
            // Convert base64 to Blob
            const byteCharacters = atob(file.data);
            const byteArrays = [];

            for (
              let offset = 0;
              offset < byteCharacters.length;
              offset += 512
            ) {
              const slice = byteCharacters.slice(offset, offset + 512);

              const byteNumbers = new Array(slice.length);
              for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
              }

              const byteArray = new Uint8Array(byteNumbers);
              byteArrays.push(byteArray);
            }

            const blob = new Blob(byteArrays, { type: file.mimeType });

            return {
              ...file,
              blob,
            };
          })
        );

        setFiles(filesWithBlobs);
      } catch (error) {
        console.error("Error converting base64 to blobs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    convertBase64ToBlobs();
    setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

    return () => {
      // Clean up object URLs to prevent memory leaks
      objectUrls.current.forEach(URL.revokeObjectURL);
      objectUrls.current = [];
    };
  }, [initialFiles]);

  const toggleFileSelection = (index: number) => {
    setSelectedFiles((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const downloadFolder = async (
    filesToDownload: (FileItem & { blob?: Blob })[]
  ) => {
    setIsDownloading(true);

    try {
      const zip = new JSZip();
      const folderName = filesToDownload[0]?.name.split(".")[0] || "download";
      const folder = zip.folder(folderName);

      for (const file of filesToDownload) {
        if (!file.blob) continue;

        try {
          folder?.file(file.name, await file.blob.arrayBuffer());
        } catch (fileError) {
          console.warn(`Error processing file: ${file.name}`, fileError);
        }
      }

      if (!folder) {
        console.error("No valid files to download.");
        setIsDownloading(false);
        return;
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipUrl = window.URL.createObjectURL(zipBlob);

      const a = document.createElement("a");
      a.style.display = "none";
      a.href = zipUrl;
      a.download = `${folderName}.zip`;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(zipUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading folder:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  async function shareImages() {
    const imageFiles = files
      .filter((file) => file.blob?.type.startsWith("image/"))
      .map((file) => {
        if (!file.blob) return null;
        return new File([file.blob], file.name, {
          type: file.blob.type,
        });
      })
      .filter(Boolean) as File[];

    if (imageFiles.length === 0) {
      console.warn("No images to share.");
      return;
    }

    try {
      const shareData = {
        files: imageFiles,
        title: "Shared Images",
        text: "Here are some images I'd like to share!",
      };

      await navigator.share(shareData);
      console.log("Images shared successfully!");
    } catch (error) {
      console.error("Error sharing images:", error);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-12">
        <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 animate-spin mb-4" />
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Loading Files</h2>
        <p className="text-muted-foreground text-center">
          Please wait while your files are being prepared...
        </p>
      </div>
    );
  }

  if (isDownloading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] py-12">
        <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 animate-spin mb-4" />
        <h2 className="text-xl sm:text-2xl font-bold mb-2">
          Downloading Files
        </h2>
        <p className="text-muted-foreground text-center">
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
          onClick={() => downloadFolder(files)}
          disabled={isDownloading || files.length === 0}
          className="w-full sm:w-auto"
        >
          Download All Files
        </Button>
        <Button
          onClick={() =>
            downloadFolder(
              files.filter((file, index) => selectedFiles.includes(index))
            )
          }
          disabled={selectedFiles.length === 0 || isDownloading}
          className="w-full sm:w-auto"
        >
          Download Selected Files
        </Button>
        {isMobile &&
          navigator.share &&
          files.filter((file) => file.blob?.type.startsWith("image/")).length >
            0 && (
            <Button onClick={shareImages} className="w-full sm:w-auto">
              Save Images
            </Button>
          )}
      </div>
      <div className="mt-6">
        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 gap-4">
          {files.map((file, index) => {
            if (!file.blob) return null;

            const objectUrl = URL.createObjectURL(file.blob);
            objectUrls.current.push(objectUrl);

            return (
              <Card
                key={file.id}
                className="relative min-w-[50px]"
                onClick={() => toggleFileSelection(index)}
              >
                <CardContent className="p-4">
                  <Checkbox
                    id={`file-${file.id}`}
                    checked={selectedFiles.includes(index)}
                    onCheckedChange={() => toggleFileSelection(index)}
                    className="absolute top-2 right-2 z-10"
                  />
                  {file.blob.type.startsWith("image/") ? (
                    <div className="relative w-full h-40">
                      <Image
                        src={objectUrl || "/placeholder.svg"}
                        alt={file.name}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">{file.blob.type}</span>
                    </div>
                  )}
                  <p className="mt-2 text-sm truncate">{file.name}</p>
                </CardContent>
              </Card>
            );
          })}
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
