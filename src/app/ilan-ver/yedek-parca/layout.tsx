import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Yedek Parça İlanı Ver",
  path: "/ilan-ver/yedek-parca",
});

export default function IlanVerYedekParcaLayout({ children }: { children: ReactNode }) {
  return children;
}
