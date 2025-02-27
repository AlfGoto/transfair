import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  X,
  ImageIcon,
  FileCode,
  FileJson,
  FileSpreadsheet,
} from "lucide-react";
import Image from "next/image";

interface FilePreviewProps {
  file: {
    file: Blob | MediaSource;
    id: string;
    name: string;
    type: string;
    size: number;
    preview?: string;
  };
  onRemove: (id: string) => void;
  formatSize: (size: number) => string;
}

export function FilePreview({ file, onRemove, formatSize }: FilePreviewProps) {
  const getFileIcon = (type: string, name: string) => {
    if (type.startsWith("image/"))
      return <ImageIcon className="h-8 w-8 text-muted-foreground" />;
    if (type.startsWith("text/"))
      return <FileText className="h-8 w-8 text-muted-foreground" />;
    if (name.endsWith(".json"))
      return <FileJson className="h-8 w-8 text-muted-foreground" />;
    if (name.endsWith(".csv"))
      return <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />;
    if (
      name.endsWith(".md") ||
      name.endsWith(".xml") ||
      name.endsWith(".yml") ||
      name.endsWith(".yaml")
    ) {
      return <FileCode className="h-8 w-8 text-muted-foreground" />;
    }
    return <FileText className="h-8 w-8 text-muted-foreground" />;
  };

  const renderPreview = () => {
    if (file.type.startsWith("image/")) {
      return (
        <div className="relative w-full h-32 sm:h-40 min-w-[50px]">
          <Image
            src={URL.createObjectURL(file.file)}
            alt={file.name}
            fill
            style={{ objectFit: "cover" }}
          />
        </div>
      );
    }

    return (
      <div className="w-full h-32 sm:h-40 bg-muted flex flex-col items-center justify-center min-w-[50px] p-4">
        {getFileIcon(file.type, file.name)}
        {file.preview ? (
          <ScrollArea className="h-full w-full rounded-md mt-2">
            <p className="text-xs text-muted-foreground font-mono p-2">
              {file.preview}
            </p>
          </ScrollArea>
        ) : (
          <span className="text-muted-foreground text-sm sm:text-base mt-2">
            {file.type || "Unknown type"}
          </span>
        )}
      </div>
    );
  };

  return (
    <Card className="h-full min-w-[50px] group relative">
      <Button
        variant="destructive"
        size="icon"
        className="absolute -right-2 -top-2 z-10 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onRemove(file.id)}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Remove file</span>
      </Button>

      <CardContent className="p-4 flex flex-col h-full min-w-[50px]">
        {renderPreview()}
        <div className="mt-2 space-y-1">
          <p className="text-sm truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatSize(file.size)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
