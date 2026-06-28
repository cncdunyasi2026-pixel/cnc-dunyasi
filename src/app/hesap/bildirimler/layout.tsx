import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Bildirimler",
  path: "/hesap/bildirimler",
  noIndex: true,
});

export default function BildirimlerLayout({ children }: { children: ReactNode }) {
  return children;
}
