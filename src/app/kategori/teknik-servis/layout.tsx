import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Teknik Servis",
  description: "CNC tezgah teknik servis ilanları ve uzman servis firmaları.",
  path: "/kategori/teknik-servis",
});

export default function TeknikServisLayout({ children }: { children: ReactNode }) {
  return children;
}
