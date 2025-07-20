import "../globals.css";
import { Inter } from "next/font/google";
import { Header } from "@/components/Header";
import { Providers } from "@/components/Providers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { Locale, locales } from "@/i18n/config";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: {
    default: "Transfair",
  },
  description: "A simple file upload and download application",
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Await params before using its properties
  const { locale } = await params;
  // Ensure that the incoming `locale` is valid
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Providing all messages to the client 
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} className="h-full">
      <head>
        <meta name="google-adsense-account" content="ca-pub-9853522416934473" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9853522416934473"
          crossOrigin="anonymous"
        ></script>
        <link rel="icon" href="/icon.png" type="image/png" />
      </head>
      <body
        className={`${inter.className} flex min-h-full flex-col w-full bg-background text-foreground`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <Header />
            <main className="flex-1 w-full flex">{children}</main>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
