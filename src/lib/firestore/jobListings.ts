import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp, where } from "firebase/firestore";
import { db, isFirebaseClientConfigured } from "@/lib/firebase";
import type { JobListingFirestoreWrite } from "@/types/jobDraft";
import type { JobListing } from "@/types/job";
import { mapJobListingFromFirestore } from "@/lib/firestore/mapJobDoc";

const BROWSE_PAGE_SIZE = 60;

export async function createJobListingDoc(data: JobListingFirestoreWrite) {
  return addDoc(collection(db, "job_listings"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function mapDocToJobListing(id: string, data: Record<string, unknown>): JobListing {
  return mapJobListingFromFirestore(id, data);
}

export async function getPublishedJobListings(pageSize = BROWSE_PAGE_SIZE): Promise<JobListing[]> {
  const q = query(
    collection(db, "job_listings"),
    where("status", "==", "published"),
    orderBy("createdAt", "desc"),
    limit(pageSize),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapDocToJobListing(d.id, d.data() as Record<string, unknown>));
}

export async function getJobListingBySlugClient(slug: string): Promise<JobListing | null> {
  if (!isFirebaseClientConfigured) {
    return null;
  }

  const q = query(
    collection(db, "job_listings"),
    where("slug", "==", slug),
    where("status", "==", "published"),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) {
    return null;
  }

  const d = snap.docs[0];
  return mapDocToJobListing(d.id, d.data() as Record<string, unknown>);
}
