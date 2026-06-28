import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "İkinci El CNC İlanı Ver",
  path: "/ilan-ver/ikinci-el",
});

export default function IlanVerIkinciElLayout({ children }: { children: ReactNode }) {
  return children;
}
