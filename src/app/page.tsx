"use client";

import { SessionProvider } from "next-auth/react";
import { FileUploader } from "../components/FileUploader";

export default function Home() {
  return (
    <SessionProvider>
      <div className="max-w-4xl mx-auto mt-10">
        <h1 className="text-2xl font-bold mb-4">Upload Files</h1>
        <FileUploader apiUrl={String(process.env.NEXT_PUBLIC_API_TRANSFER)} />
      </div>
    </SessionProvider>
  );
}
