import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "İlanlarım",
  path: "/hesap/ilanlarim",
  noIndex: true,
});

export default function IlanlarimLayout({ children }: { children: ReactNode }) {
  return children;
}
