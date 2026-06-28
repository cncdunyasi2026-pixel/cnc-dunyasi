import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Yedek Parça",
  description: "CNC yedek parça ilanları ve tedarikçi firmalar.",
  path: "/kategori/yedek-parca",
});

export default function YedekParcaLayout({ children }: { children: ReactNode }) {
  return children;
}
