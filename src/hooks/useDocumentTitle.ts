import { useEffect } from "react";

/** Sekme başlığını yalnızca verilen metinle günceller (marka eki yok). */
export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    if (!title) return;
    document.title = title;
  }, [title]);
}
