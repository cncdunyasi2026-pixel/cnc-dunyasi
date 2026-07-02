import { createAd } from "@/services/adService";
import { uploadUserImagesWithPaths, uploadUserVideoWithPath } from "@/services/storageUpload";
import type { AdListingDraft } from "@/lib/listing/listingDraftStore";
import { clearAdListingDraft } from "@/lib/listing/listingDraftStore";
import { getUserDoc } from "@/lib/firestore/users";

export async function publishAdListingDraft(draft: AdListingDraft): Promise<string> {
  const parsedPower = draft.powerKw.trim() ? Number(draft.powerKw) : NaN;
  const parsedWidth = draft.tableWidthMm.trim() ? Number(draft.tableWidthMm) : NaN;
  const parsedLength = draft.tableLengthMm.trim() ? Number(draft.tableLengthMm) : NaN;
  const hasTableWidth = draft.tableWidthMm.trim().length > 0;
  const hasTableLength = draft.tableLengthMm.trim().length > 0;

  const uploaded = await uploadUserImagesWithPaths(draft.files, `ad-images/${draft.userId}`);
  const uploadedVideo = draft.videoFile
    ? await uploadUserVideoWithPath(draft.videoFile, `ad-videos/${draft.userId}`)
    : null;

  const profile = await getUserDoc(draft.userId);
  const sellerPhone = profile?.phone?.trim();

  const now = Date.now();
  const ref = await createAd({
    title: draft.title.trim(),
    brand: draft.brand.trim(),
    model: draft.model.trim(),
    price: Math.round(draft.price),
    currency: draft.currency,
    city: draft.location.city.trim(),
    district: draft.location.district.trim(),
    neighborhood: draft.location.neighborhood.trim(),
    category: draft.category.trim(),
    condition: draft.condition,
    ...(draft.year ? { year: Number(draft.year) } : {}),
    ...(draft.powerKw.trim() && Number.isFinite(parsedPower) ? { powerKw: Math.round(parsedPower) } : {}),
    ...(hasTableWidth && hasTableLength
      ? { tableWidthMm: Math.round(parsedWidth), tableLengthMm: Math.round(parsedLength) }
      : {}),
    axisCount: draft.axisCount || undefined,
    sellerType: draft.sellerType,
    trade: draft.trade,
    delivery: draft.delivery,
    description: draft.description.trim(),
    images: uploaded.map((item) => item.url),
    imagePaths: uploaded.map((item) => item.path),
    ...(uploadedVideo ? { video: uploadedVideo.url, videoPath: uploadedVideo.path } : {}),
    ...(draft.labelMissing ? { machineLabelMissing: true } : {}),
    ownerId: draft.userId,
    userName: draft.userName,
    ...(sellerPhone ? { phone: sellerPhone } : {}),
    status: "pending",
    isPaid: true,
    listingFee: 499,
    discountedFee: 0,
    paymentStartedAt: now,
    paymentDueAt: now + 24 * 60 * 60 * 1000,
  });

  clearAdListingDraft();
  return ref.id;
}
