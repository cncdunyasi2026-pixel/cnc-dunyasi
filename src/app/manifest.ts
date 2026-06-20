import type { MetadataRoute } from "next";
import { BRAND_NAME } from "@/lib/constants/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND_NAME,
    short_name: BRAND_NAME,
    description: "İkinci el CNC, teknik servis, yedek parça ve kariyer platformu",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0F2A4A",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
