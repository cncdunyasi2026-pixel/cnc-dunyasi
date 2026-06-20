import { createJobListingDoc, getPublishedJobListings } from "@/lib/firestore/jobListings";
import { isFirebaseClientConfigured } from "@/lib/firebase";
import { jobListings } from "@/lib/mocks/jobs";
import type { JobListing } from "@/types/job";
import type { JobListingFirestoreWrite } from "@/types/jobDraft";

export async function loadPublishedJobListings(): Promise<JobListing[]> {
  if (!isFirebaseClientConfigured) {
    return jobListings;
  }
  return getPublishedJobListings();
}

export async function submitJobListing(data: JobListingFirestoreWrite) {
  if (!isFirebaseClientConfigured) {
    throw new Error("Firebase tasarim modunda devre disi. Is ilani icin .env.local tanimlayin.");
  }

  return createJobListingDoc(data);
}
