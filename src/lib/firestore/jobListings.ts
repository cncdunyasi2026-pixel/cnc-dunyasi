import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db, isFirebaseClientConfigured } from "@/lib/firebase";
import type { JobListingFirestoreWrite } from "@/types/jobDraft";
import type { JobListing } from "@/types/job";
import { mapJobListingFromFirestore } from "@/lib/firestore/mapJobDoc";

const BROWSE_PAGE_SIZE = 60;
const DEFAULT_PAGE_SIZE = 24;

export type JobCursor = QueryDocumentSnapshot<DocumentData> | null;

export type JobPageResult = {
  items: JobListing[];
  lastDoc: JobCursor;
  hasMore: boolean;
};

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

export async function getPublishedJobListingsPage(
  pageSize = DEFAULT_PAGE_SIZE,
  lastDoc: JobCursor = null,
): Promise<JobPageResult> {
  const constraints = [
    where("status", "==", "published"),
    orderBy("createdAt", "desc"),
  ];
  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }
  constraints.push(limit(pageSize));

  const snap = await getDocs(query(collection(db, "job_listings"), ...constraints));
  const items = snap.docs.map((d) => mapDocToJobListing(d.id, d.data() as Record<string, unknown>));
  const newLastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : lastDoc;

  return {
    items,
    lastDoc: newLastDoc,
    hasMore: snap.docs.length === pageSize,
  };
}

export async function getPublishedJobListings(pageSize = BROWSE_PAGE_SIZE): Promise<JobListing[]> {
  const { items } = await getPublishedJobListingsPage(pageSize);
  return items;
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
