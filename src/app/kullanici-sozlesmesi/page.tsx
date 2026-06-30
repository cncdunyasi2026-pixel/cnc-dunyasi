import LegalDocumentView from "@/components/legal/LegalDocumentView";
import { getLegalDocumentForPage } from "@/lib/legal/getLegalDocument.server";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Kullanıcı Sözleşmesi",
  path: "/kullanici-sozlesmesi",
});

export default async function UserAgreementPage() {
  const document = await getLegalDocumentForPage("userAgreement");
  return <LegalDocumentView title={document.title} body={document.body} />;
}
