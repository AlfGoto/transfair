import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Transfair - Free Secure File Transfer",
    short_name: "Transfair",
    description:
      "Send large files up to 2GB for free. Secure file transfer and sharing service - no registration required.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    orientation: "portrait-primary",
    categories: ["productivity", "utilities"],
    lang: "en",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
    screenshots: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        form_factor: "wide",
        label: "Transfair File Transfer Interface",
      },
    ],
  };
}
