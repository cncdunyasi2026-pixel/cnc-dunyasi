import type { Ad } from "@/types/ad";
import { coerceFirestoreMillis } from "@/lib/firestore/coerceFirestoreMillis";

export function mapAdSnapshotToAd(id: string, data: Record<string, unknown>): Ad {
  const ownerRaw = data.ownerId ?? data.userId;
  const ownerId = typeof ownerRaw === "string" ? ownerRaw : String(ownerRaw ?? "");
  const revisionRaw = data.revisionNote;
  const revisionNote =
    typeof revisionRaw === "string" && revisionRaw.trim() ? revisionRaw.trim() : undefined;
  const revisionFieldsRaw = data.revisionFields;
  const revisionFields: Record<string, string> | undefined =
    revisionFieldsRaw && typeof revisionFieldsRaw === "object"
      ? (Object.fromEntries(
          Object.entries(revisionFieldsRaw as Record<string, unknown>).filter(
            ([, value]) => typeof value === "string" && value.trim().length > 0,
          ),
        ) as Record<string, string>)
      : undefined;

  const {
    createdAt: _c,
    updatedAt: _u,
    publishedAt: _p,
    deletedAt: _d,
    paymentStartedAt: _ps,
    paymentDueAt: _pd,
    revisionNote: _r,
    revisionFields: _rf,
    ownerId: _o,
    userId: _legacyUid,
    isFeatured: _feat,
    weeklyDeal: _deal,
    sourceListingId: _source,
    ...rest
  } = data;

  return {
    ...(rest as Omit<
      Ad,
      | "id"
      | "createdAt"
      | "ownerId"
      | "publishedAt"
      | "deletedAt"
      | "revisionNote"
      | "isFeatured"
      | "weeklyDeal"
      | "sourceListingId"
    >),
    id,
    ownerId,
    price: typeof data.price === "number" ? data.price : Number(data.price) || 0,
    createdAt: coerceFirestoreMillis(data.createdAt),
    publishedAt:
      data.publishedAt != null ? coerceFirestoreMillis(data.publishedAt) : undefined,
    deletedAt:
      data.deletedAt != null ? coerceFirestoreMillis(data.deletedAt) : undefined,
    revisionNote,
    ...(revisionFields && Object.keys(revisionFields).length > 0 ? { revisionFields } : {}),
    ...(data.isFeatured === true ? { isFeatured: true as const } : {}),
    ...(data.weeklyDeal === true ? { weeklyDeal: true as const } : {}),
    ...(typeof data.sourceListingId === "string" && data.sourceListingId
      ? { sourceListingId: data.sourceListingId }
      : {}),
    ...(data.isPaid === true ? { isPaid: true as const } : {}),
    ...(typeof data.listingFee === "number" ? { listingFee: data.listingFee } : {}),
    ...(typeof data.discountedFee === "number" ? { discountedFee: data.discountedFee } : {}),
    ...(data.paymentStartedAt != null
      ? { paymentStartedAt: coerceFirestoreMillis(data.paymentStartedAt) }
      : {}),
    ...(data.paymentDueAt != null
      ? { paymentDueAt: coerceFirestoreMillis(data.paymentDueAt) }
      : {}),
    ...(typeof data.year === "number" ? { year: data.year } : {}),
    ...(typeof data.powerKw === "number" ? { powerKw: data.powerKw } : {}),
    ...(typeof data.tableWidthMm === "number" ? { tableWidthMm: data.tableWidthMm } : {}),
    ...(typeof data.tableLengthMm === "number" ? { tableLengthMm: data.tableLengthMm } : {}),
    ...(typeof data.axisCount === "string" && data.axisCount ? { axisCount: data.axisCount } : {}),
    ...(typeof data.sellerType === "string" && data.sellerType ? { sellerType: data.sellerType } : {}),
    ...(typeof data.phone === "string" && data.phone.trim() ? { phone: data.phone.trim() } : {}),
    ...(typeof data.trade    === "string" && data.trade    ? { trade:    data.trade }    : {}),
    ...(typeof data.delivery === "string" && data.delivery ? { delivery: data.delivery } : {}),
    ...(typeof data.clickCount === "number" ? { clickCount: data.clickCount } : {}),
    ...(Array.isArray(data.changedFields) && data.changedFields.length > 0
      ? { changedFields: data.changedFields.filter((v): v is string => typeof v === "string") }
      : {}),
    ...(data.machineLabelMissing === true ? { machineLabelMissing: true as const } : {}),
    ...(data.currency === "USD" || data.currency === "EUR" || data.currency === "GBP"
      ? { currency: data.currency as "USD" | "EUR" | "GBP" }
      : {}),
  };
}
