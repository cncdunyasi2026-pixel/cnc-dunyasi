import "server-only";

import { doc, getDoc } from "firebase/firestore";
import { DEFAULT_FOOTER_SETTINGS, FOOTER_DOC_ID } from "@/lib/constants/footerDefaults";
import { readLegalMarkdown, type LegalDocumentKind } from "@/lib/legal/readLegalMarkdown.server";
import { db } from "@/lib/firebase";
import type { FooterLegalDocument } from "@/types/footer";

const COLLECTION = "site_footer";

function resolveDocument(
  kind: LegalDocumentKind,
  stored: FooterLegalDocument | undefined,
): FooterLegalDocument {
  const fallback = readLegalMarkdown(kind);
  const defaultDoc = kind === "kvkk" ? DEFAULT_FOOTER_SETTINGS.kvkk : DEFAULT_FOOTER_SETTINGS.userAgreement;

  const title = stored?.title?.trim() || fallback.title || defaultDoc.title;
  const body = stored?.body?.trim() || fallback.body;

  return { title, body };
}

export async function getLegalDocumentForPage(kind: LegalDocumentKind): Promise<FooterLegalDocument> {
  try {
    const snap = await getDoc(doc(db, COLLECTION, FOOTER_DOC_ID));
    if (!snap.exists()) {
      return resolveDocument(kind, undefined);
    }

    const data = snap.data();
    const stored =
      kind === "kvkk"
        ? (data.kvkk as FooterLegalDocument | undefined)
        : (data.userAgreement as FooterLegalDocument | undefined);

    return resolveDocument(kind, stored);
  } catch {
    return resolveDocument(kind, undefined);
  }
}
