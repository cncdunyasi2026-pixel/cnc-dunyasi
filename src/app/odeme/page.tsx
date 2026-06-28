import OdemeClient, { type OdemeKindMeta } from "@/components/listing/OdemeClient";

type Props = {
  searchParams: Promise<{
    listingId?: string;
    kind?: string;
    mode?: string;
    slug?: string;
  }>;
};

const KIND_META: Record<string, OdemeKindMeta> = {
  ads: {
    eyebrow: "İKİNCİ EL CNC",
    label: "Tezgah ilanın",
    successHref: "/hesap/ilanlarim",
    browseHref: "/ilanlar",
    formHref: "/ilan-ver/ikinci-el",
  },
  technical: {
    eyebrow: "TEKNİK SERVİS",
    label: "Servis profilin",
    successHref: "/hesap/ilanlarim",
    browseHref: "/kategori/teknik-servis",
    formHref: "/ilan-ver/teknik-servis",
  },
  spare: {
    eyebrow: "YEDEK PARÇA",
    label: "Firma profilin",
    successHref: "/hesap/ilanlarim",
    browseHref: "/kategori/yedek-parca",
    formHref: "/ilan-ver/yedek-parca",
  },
  job: {
    eyebrow: "KARİYER",
    label: "İş ilanın",
    successHref: "/hesap/ilanlarim",
    browseHref: "/kariyer",
    formHref: "/ilan-ver/kariyer",
  },
};

const DEFAULT_META = KIND_META.ads;

export default async function OdemePage({ searchParams }: Props) {
  const { listingId, kind = "ads", mode } = await searchParams;
  const meta = KIND_META[kind] ?? DEFAULT_META;

  return <OdemeClient listingId={listingId} kind={kind} mode={mode} meta={meta} />;
}
