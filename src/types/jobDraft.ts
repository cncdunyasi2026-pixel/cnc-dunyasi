import type { JobListing } from "@/types/job";
import type { ListingLifecycleStatus } from "@/types/listingStatus";

/** Firestore'a yazim (`createdAt` sunucuda atanir). */
export type JobListingFirestoreWrite = Omit<JobListing, "id"> & {
  ownerId: string;
  userName: string;
  status: ListingLifecycleStatus;
};
