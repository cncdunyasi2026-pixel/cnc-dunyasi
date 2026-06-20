import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cncdunyam",
    short_name: "Cncdunyam",
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
