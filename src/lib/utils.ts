import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const isTextFile = (file: File) => {
  return (
    file.type.startsWith("text/") ||
    file.name.endsWith(".txt") ||
    file.name.endsWith(".md") ||
    file.name.endsWith(".json") ||
    file.name.endsWith(".csv") ||
    file.name.endsWith(".xml") ||
    file.name.endsWith(".yml") ||
    file.name.endsWith(".yaml")
  );
};

export const readTextFile = async (
  file: File,
  previewLength: number = 200
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(
        text.slice(0, previewLength) +
          (text.length > previewLength ? "..." : "")
      );
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
};

export function formatSize(bytes: number, t?: (key: string) => string) {
  if (bytes === 0) return `0 ${t?.("sizeBytes") || "Bytes"}`;
  const k = 1024;
  const sizeKeys = ["sizeBytes", "sizeKB", "sizeMB"];
  const defaultSizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = t ? t(sizeKeys[i]) : defaultSizes[i];
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + size;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
