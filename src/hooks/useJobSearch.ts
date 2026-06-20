"use client";

import { useEffect, useState } from "react";
import { searchJobs, type SearchJobsParams } from "@/services/jobSearchService";
import type { JobListing } from "@/types/job";
import type { JobSearchFilters } from "@/lib/utils/jobSearch";

export function useJobSearch(activeQuery: string, filters: JobSearchFilters = {}) {
  const [results, setResults] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedQuery = activeQuery.trim();
  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    if (!trimmedQuery) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const params: SearchJobsParams = { query: trimmedQuery, ...filters };

    void searchJobs(params)
      .then((jobs) => {
        if (cancelled) return;
        setResults(jobs);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Arama yapılamadı.");
        setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [trimmedQuery, filtersKey]);

  return { results, loading, error, isActive: trimmedQuery.length > 0 };
}
