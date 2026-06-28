import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Kariyer",
  description: "CNC sektöründe iş ilanları ve kariyer fırsatları.",
  path: "/kariyer",
});

export default function KariyerLayout({ children }: { children: ReactNode }) {
  return children;
}
