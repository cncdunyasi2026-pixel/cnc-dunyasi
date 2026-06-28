import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Ödeme",
  path: "/odeme",
  noIndex: true,
});

export default function OdemeLayout({ children }: { children: ReactNode }) {
  return children;
}
