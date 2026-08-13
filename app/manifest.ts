import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Haven",
    short_name: "Haven",
    description: "Temporary email and privacy tools",
    start_url: "/",
    display: "standalone",
    background_color: "#f4fbf9",
    theme_color: "#1b7869",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
