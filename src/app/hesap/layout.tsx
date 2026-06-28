import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Hesabım",
  noIndex: true,
});

export default function HesapLayout({ children }: { children: ReactNode }) {
  return children;
}
