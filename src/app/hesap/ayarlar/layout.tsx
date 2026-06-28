import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Ayarlar",
  path: "/hesap/ayarlar",
  noIndex: true,
});

export default function AyarlarLayout({ children }: { children: ReactNode }) {
  return children;
}
