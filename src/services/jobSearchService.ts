import { mapDocToJobListing } from "@/lib/firestore/jobListings";
import {
  fetchServerSearch,
  searchPublishedCollectionClient,
} from "@/lib/firestore/searchCollectionClient";
import { isFirebaseClientConfigured } from "@/lib/firebase";
import { jobListings } from "@/lib/mocks/jobs";
import type { JobListing } from "@/types/job";
import {
  jobMatchesSearchQuery,
  passesJobSearchFilters,
  type JobSearchFilters,
} from "@/lib/utils/jobSearch";

export type SearchJobsParams = JobSearchFilters & {
  query: string;
};

function buildSearchUrl(params: SearchJobsParams): string {
  const url = new URL("/api/jobs/search", window.location.origin);
  url.searchParams.set("q", params.query.trim());

  if (params.workModels?.length) url.searchParams.set("workModels", params.workModels.join(","));
  if (params.positions?.length) url.searchParams.set("positions", params.positions.join(","));
  if (params.experienceLevels?.length) {
    url.searchParams.set("experienceLevels", params.experienceLevels.join(","));
  }
  if (params.cities?.length) url.searchParams.set("cities", params.cities.join(","));

  return url.toString();
}

function searchMockJobs(params: SearchJobsParams): JobListing[] {
  const trimmed = params.query.trim();
  if (!trimmed) return [];

  return jobListings
    .filter((job) => passesJobSearchFilters(job, params))
    .filter((job) => jobMatchesSearchQuery(job, trimmed))
    .sort((a, b) => b.postedAt.localeCompare(a.postedAt));
}

export async function searchJobs(params: SearchJobsParams): Promise<JobListing[]> {
  const trimmed = params.query.trim();
  if (!trimmed) return [];

  if (!isFirebaseClientConfigured) {
    return searchMockJobs(params);
  }

  return fetchServerSearch(buildSearchUrl(params), () =>
    searchPublishedCollectionClient({
      collectionName: "job_listings",
      query: trimmed,
      mapDoc: mapDocToJobListing,
      matchesQuery: jobMatchesSearchQuery,
      passesFilters: (job) => passesJobSearchFilters(job, params),
      sortBy: (a, b) => b.postedAt.localeCompare(a.postedAt),
    }),
  );
}
