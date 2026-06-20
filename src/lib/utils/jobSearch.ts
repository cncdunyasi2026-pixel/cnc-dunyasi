import type { JobListing } from "@/types/job";
import {
  buildSearchTokensFromBlob,
  matchesTokenizedQuery,
  pickPrimarySearchToken,
  tokenizeSearchQuery,
} from "@/lib/utils/searchTokens";

export { pickPrimarySearchToken, tokenizeSearchQuery };

function cityFrom(location: string): string {
  return location.split(/[,/·]/)[0].trim();
}

export function getJobSearchableFields(job: Partial<JobListing>): string[] {
  return [
    job.title,
    job.company,
    job.location,
    job.workModel,
    job.position,
    job.level,
    job.experienceLevel,
    job.description,
    job.salary,
  ].filter((value): value is string => Boolean(value && String(value).trim()));
}

export function jobSearchBlob(job: Partial<JobListing>): string {
  return getJobSearchableFields(job).join(" ");
}

export function jobMatchesSearchQuery(job: Partial<JobListing>, query: string): boolean {
  return matchesTokenizedQuery(jobSearchBlob(job), query);
}

export function buildJobSearchTokens(job: Partial<JobListing>): string[] {
  return buildSearchTokensFromBlob(jobSearchBlob(job));
}

export type JobSearchFilters = {
  workModels?: string[];
  positions?: string[];
  experienceLevels?: string[];
  cities?: string[];
};

export function passesJobSearchFilters(job: JobListing, filters: JobSearchFilters): boolean {
  if (filters.workModels?.length && !filters.workModels.includes(job.workModel)) {
    return false;
  }
  if (filters.positions?.length && !filters.positions.includes(job.position ?? job.level)) {
    return false;
  }
  if (
    filters.experienceLevels?.length &&
    (!job.experienceLevel || !filters.experienceLevels.includes(job.experienceLevel))
  ) {
    return false;
  }
  if (filters.cities?.length && !filters.cities.includes(cityFrom(job.location))) {
    return false;
  }
  return true;
}
