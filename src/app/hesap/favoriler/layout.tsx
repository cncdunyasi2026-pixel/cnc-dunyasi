import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Favoriler",
  path: "/hesap/favoriler",
  noIndex: true,
});

export default function FavorilerLayout({ children }: { children: ReactNode }) {
  return children;
}
