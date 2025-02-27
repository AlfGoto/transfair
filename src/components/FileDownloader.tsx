"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import JSZip from "jszip";

interface FileItem {
  id: string;
  name: string;
  type: string;
  url: string;
}

export function FileDownloader({ initialFiles }: { initialFiles: FileItem[] }) {
  const [files] = useState<FileItem[]>(initialFiles);
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    document.title = "3F DOWN";
    setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  const toggleFileSelection = (index: number) => {
    setSelectedFiles((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const downloadFolder = async (filesToDownload: FileItem[]) => {
    setIsDownloading(true);

    try {
      const zip = new JSZip();
      const folder = zip.folder(filesToDownload[0].name.split(".")[0]);

      for (const file of filesToDownload) {
        try {
          const response = await fetch(file.url);
          if (!response.ok) {
            console.warn(`Skipping file (failed to fetch): ${file.name}`);
            continue;
          }

          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          folder?.file(file.name, arrayBuffer);
        } catch (fileError) {
          console.warn(`Error processing file: ${file.name}`, fileError);
        }
      }

      if (!folder || folder.length === 0) {
        console.error("No valid files to download.");
        return;
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipUrl = window.URL.createObjectURL(zipBlob);

      const a = document.createElement("a");
      a.style.display = "none";
      a.href = zipUrl;
      a.download = `${filesToDownload[0].name.split(".")[0]}.zip`;
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

  async function shareImages() {
    const imageFiles = await Promise.all(
      files
        .filter((file) => file.type.startsWith("image/"))
        .map(async (file) => {
          const blob = await fetch(file.url).then((r) => r.blob());
          const blobPart = await blob.arrayBuffer();
          return new File([blobPart], file.name, {
            type: file.type,
          });
        })
    );

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

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <h1 className="text-2xl font-bold mb-4">Download Files</h1>
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <Button
          onClick={() => downloadFolder(files)}
          disabled={isDownloading}
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
          files.filter((file) => file.type.startsWith("image/")).length !==
            0 && (
            <Button onClick={shareImages} className="w-full sm:w-auto">
              Save Images
            </Button>
          )}
      </div>
      <div className="mt-6">
        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-3 gap-4">
          {files.map((file, index) => (
            <Card
              key={file.name + index}
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
                {file.type.startsWith("image/") ? (
                  <div className="relative w-full h-40">
                    <Image
                      src={file.url}
                      alt={file.name}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">{file.type}</span>
                  </div>
                )}
                <p className="mt-2 text-sm truncate">{file.name}</p>
              </CardContent>
            </Card>
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
