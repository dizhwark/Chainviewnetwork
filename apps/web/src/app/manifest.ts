import type { MetadataRoute } from "next";
import { BRAND } from "@maybe/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND.name} — Toronto plumbing marketplace`,
    short_name: BRAND.name,
    description: BRAND.tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#22705f",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
