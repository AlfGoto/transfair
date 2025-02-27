export interface ImageItem {
  id: string;
  name: string;
  originalSize: number;
  preview: string | null;
  processed: Blob | null;
  original: Blob | null;
  status: "pending" | "processing" | "processed" | "error";
  error?: string;
  isRaw: boolean;
  progress: number;
  hash: string; // For caching
}
export interface File {
  id: string;
  url: string;
  name: string;
}
