import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "İlan Ver",
  description: "İkinci el CNC, teknik servis, yedek parça veya iş ilanı oluşturun.",
  path: "/ilan-ver",
});

export default function IlanVerLayout({ children }: { children: ReactNode }) {
  return children;
}
