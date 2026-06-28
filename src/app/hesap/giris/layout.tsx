import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Giriş Yap",
  path: "/hesap/giris",
  noIndex: true,
});

export default function GirisLayout({ children }: { children: ReactNode }) {
  return children;
}
