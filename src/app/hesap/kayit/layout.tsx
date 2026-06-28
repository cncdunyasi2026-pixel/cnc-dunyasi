import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Kayıt Ol",
  path: "/hesap/kayit",
  noIndex: true,
});

export default function KayitLayout({ children }: { children: ReactNode }) {
  return children;
}
