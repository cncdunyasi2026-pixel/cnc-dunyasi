import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "İkinci El CNC İlanları",
  path: "/ilanlar",
});

export default function IlanlarLayout({ children }: { children: ReactNode }) {
  return children;
}
