import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Profil",
  path: "/hesap/profil",
  noIndex: true,
});

export default function ProfilLayout({ children }: { children: ReactNode }) {
  return children;
}
