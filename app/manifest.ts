import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Skördedagbok",
    short_name: "Skörd",
    description: "Skördar från balkongen, samlade på ett ställe.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f3e8",
    theme_color: "#244b35",
    lang: "sv-SE",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
