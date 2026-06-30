import LegalDocumentView from "@/components/legal/LegalDocumentView";
import { getLegalDocumentForPage } from "@/lib/legal/getLegalDocument.server";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "KVKK",
  path: "/kvkk",
});

export default async function KvkkPage() {
  const document = await getLegalDocumentForPage("kvkk");
  return <LegalDocumentView title={document.title} body={document.body} />;
}
