import type { MarketplaceProfile } from "@/types/marketplace";

export function mapMarketplaceDocToProfile(id: string, data: Record<string, unknown>): MarketplaceProfile {
  const imgs = Array.isArray(data.images) ? (data.images as string[]) : [];
  return {
    id,
    slug: String(data.slug ?? ""),
    name: String(data.name ?? ""),
    title: String(data.title ?? ""),
    city: String(data.city ?? ""),
    district: String(data.district ?? ""),
    ...(data.neighborhood ? { neighborhood: String(data.neighborhood) } : {}),
    category: String(data.category ?? ""),
    phone: String(data.phone ?? ""),
    yearLabel: String(data.yearLabel ?? ""),
    expertise: String(data.expertise ?? ""),
    description: String(data.description ?? ""),
    images: imgs.length > 0 ? imgs : ["/banner_1.jpg"],
    ...(data.serviceType   ? { serviceType:   String(data.serviceType) }   : {}),
    ...(data.expertiseBrand ? { expertiseBrand: String(data.expertiseBrand) } : {}),
    ...(data.partCategory ? { partCategory: String(data.partCategory) } : {}),
    ...(data.brandCompat  ? { brandCompat:  String(data.brandCompat) }  : {}),
    ...(data.stockStatus  ? { stockStatus:  data.stockStatus as "Stokta Var" | "Sipariş Üzerine" } : {}),
  };
}
