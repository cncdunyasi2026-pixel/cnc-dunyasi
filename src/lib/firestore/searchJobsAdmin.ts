import "server-only";

import { mapJobListingFromFirestore } from "@/lib/firestore/mapJobDoc";
import { searchPublishedCollection } from "@/lib/firestore/searchCollectionAdmin";
import type { JobListing } from "@/types/job";
import {
  jobMatchesSearchQuery,
  passesJobSearchFilters,
  type JobSearchFilters,
} from "@/lib/utils/jobSearch";

export async function searchPublishedJobsAdmin(
  query: string,
  filters: JobSearchFilters = {},
): Promise<JobListing[]> {
  return searchPublishedCollection({
    collectionName: "job_listings",
    query,
    mapDoc: mapJobListingFromFirestore,
    matchesQuery: jobMatchesSearchQuery,
    passesFilters: (job) => passesJobSearchFilters(job, filters),
    sortBy: (a, b) => b.postedAt.localeCompare(a.postedAt),
  });
}
