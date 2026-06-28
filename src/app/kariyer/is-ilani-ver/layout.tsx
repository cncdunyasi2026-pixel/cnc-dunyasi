import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "İş İlanı Ver",
  path: "/kariyer/is-ilani-ver",
});

export default function IsIlaniVerLayout({ children }: { children: ReactNode }) {
  return children;
}
