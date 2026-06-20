import { collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

type ListingCollection =
  | "ads"
  | "technical_service_listings"
  | "spare_part_listings"
  | "job_listings";

const ARCHIVE_FIELDS = {
  status: "archived",
  deletedAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
} as const;

/**
 * Belirtilen ilanı arşivler.
 * Eğer bu ilana ait update_pending / needs_revision / revision_resubmitted kopyalar varsa
 * (sourceListingId == id), onlar da arşivlenir — sitede çift ilan kalmaması için.
 */
export async function archiveListingDoc(
  collectionName: ListingCollection,
  id: string,
  reason: string,
): Promise<void> {
  // Orijinal ilanı arşivle
  await updateDoc(doc(db, collectionName, id), {
    ...ARCHIVE_FIELDS,
    removalReason: reason,
  });

  // İlgili kopyaları da arşivle (duplicate görünümü önlemek için)
  try {
    const copiesSnap = await getDocs(
      query(collection(db, collectionName), where("sourceListingId", "==", id)),
    );
    await Promise.all(
      copiesSnap.docs
        .filter((d) => {
          const s = d.data().status as string;
          return s === "update_pending" || s === "needs_revision" || s === "revision_resubmitted" || s === "published";
        })
        .map((d) =>
          updateDoc(d.ref, {
            ...ARCHIVE_FIELDS,
            removalReason: "Orijinal ilan kaldırıldı",
          }),
        ),
    );
  } catch {
    // Kopyalar arşivlenemezse orijinal arşivi yine de geçerli
  }
}
