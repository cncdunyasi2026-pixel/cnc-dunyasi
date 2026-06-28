import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Teknik Servis İlanı Ver",
  path: "/ilan-ver/teknik-servis",
});

export default function IlanVerTeknikServisLayout({ children }: { children: ReactNode }) {
  return children;
}
