import {
  createJobListingDoc,
  getPublishedJobListings,
  getPublishedJobListingsPage,
  type JobCursor,
  type JobPageResult,
} from "@/lib/firestore/jobListings";
import { isFirebaseClientConfigured } from "@/lib/firebase";
import { jobListings } from "@/lib/mocks/jobs";
import type { JobListing } from "@/types/job";
import type { JobListingFirestoreWrite } from "@/types/jobDraft";
import type { PaginatedFetchParams } from "@/hooks/usePaginatedBrowse";

const DEFAULT_PAGE_SIZE = 24;

export async function loadPublishedJobListingsPage(
  params: PaginatedFetchParams = {},
): Promise<JobPageResult> {
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;

  if (!isFirebaseClientConfigured) {
    const offset = params.offset ?? 0;
    const page = jobListings.slice(offset, offset + pageSize);

    return {
      items: page,
      lastDoc: null,
      hasMore: offset + pageSize < jobListings.length,
    };
  }

  return getPublishedJobListingsPage(pageSize, (params.lastDoc as JobCursor) ?? null);
}

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

export async function getRelatedJobListings(
  current: Pick<JobListing, "id" | "slug" | "title" | "position" | "workModel">,
  limit = 4,
): Promise<JobListing[]> {
  const { items } = await loadPublishedJobListingsPage({ pageSize: Math.max(limit + 8, 24) });

  const pool = items.filter(
    (item) => item.id !== current.id && item.slug !== current.slug,
  );

  if (pool.length === 0) {
    return [];
  }

  const matchers: Array<(item: JobListing) => boolean> = [];

  if (current.position) {
    matchers.push((item) => item.position === current.position);
  }
  if (current.title) {
    matchers.push((item) => item.title === current.title);
  }
  if (current.workModel) {
    matchers.push((item) => item.workModel === current.workModel);
  }

  for (const match of matchers) {
    const matched = pool.filter(match);
    if (matched.length > 0) {
      return matched.slice(0, limit);
    }
  }

  return pool.slice(0, limit);
}
