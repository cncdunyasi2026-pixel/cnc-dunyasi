import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { stripUndefined } from "@/lib/firestore/ads";

export type PaymentListingKind = "ads" | "technical" | "spare" | "job";

const KIND_TO_COLLECTION: Record<PaymentListingKind, string> = {
  ads: "ads",
  technical: "technical_service_listings",
  spare: "spare_part_listings",
  job: "job_listings",
};

export function resolvePaymentCollection(kind: string): string {
  return KIND_TO_COLLECTION[kind as PaymentListingKind] ?? KIND_TO_COLLECTION.ads;
}

export async function confirmListingPayment(
  kind: string,
  listingId: string,
): Promise<void> {
  const collectionName = resolvePaymentCollection(kind);
  const ref = doc(db, collectionName, listingId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error("İlan bulunamadı.");
  }

  const data = snap.data();
  if (data.status === "pending" && data.isPaid === true) {
    return;
  }
  if (data.status !== "draft") {
    throw new Error("Bu ilan ödeme adımı için uygun değil.");
  }

  await updateDoc(
    ref,
    stripUndefined({
      isPaid: true,
      status: "pending",
      paymentCompletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
}
