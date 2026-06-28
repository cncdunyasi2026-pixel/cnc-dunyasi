export type ListingCollection =
  | "ads"
  | "technical_service_listings"
  | "spare_part_listings"
  | "job_listings";

const COLLECTION_LABELS: Record<ListingCollection, string> = {
  ads: "İkinci el CNC ilanı",
  technical_service_listings: "Teknik servis ilanı",
  spare_part_listings: "Yedek parça ilanı",
  job_listings: "İş ilanı",
};

export function listingLabel(collection: ListingCollection): string {
  return COLLECTION_LABELS[collection];
}

export function listingTitleFromData(data: Record<string, unknown>): string {
  const title = data.title ?? data.name;
  if (typeof title === "string" && title.trim()) return title.trim();
  return "İlanınız";
}

export function listingDetailHref(collection: ListingCollection, listingId: string): string {
  if (collection === "ads") return `/hesap/ilanlarim/${listingId}`;
  return "/hesap/ilanlarim";
}

export function listingEditHref(collection: ListingCollection, listingId: string): string {
  if (collection === "ads") return `/hesap/ilanlarim/duzenle/${listingId}`;
  return "/hesap/ilanlarim";
}
