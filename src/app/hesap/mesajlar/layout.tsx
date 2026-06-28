import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Mesajlar",
  path: "/hesap/mesajlar",
  noIndex: true,
});

export default function MesajlarLayout({ children }: { children: ReactNode }) {
  return children;
}
