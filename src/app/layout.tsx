import "./globals.css";
import { Inter } from "next/font/google";
import { Header } from "@/components/Header";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: {
    template: "%s | 3F",
    default: "Transfair",
  },
  description: "A simple file upload and download application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <html lang="en" className="h-full">
        <link rel="icon" href="/icon.png" type="image/png" />
        <body
          className={`${inter.className} flex min-h-full flex-col w-full bg-background text-foreground`}
        >
          <Header />
          <main className="flex-1 w-full flex">{children}</main>
        </body>
      </html>
    </Providers>
  );
}
