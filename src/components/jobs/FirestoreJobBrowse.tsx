"use client";

import { useEffect, useState } from "react";
import JobBrowsePanel from "@/components/jobs/JobBrowsePanel";
import { loadPublishedJobListings } from "@/services/jobListingService";
import type { JobListing } from "@/types/job";

export default function FirestoreJobBrowse() {
  const [items, setItems] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void loadPublishedJobListings()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Liste yüklenemedi.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <p className="rounded-xl border border-[#dbe2ea] bg-white px-4 py-6 text-center text-sm font-semibold text-[#7A8CA5]">
        İlanlar yükleniyor...
      </p>
    );
  }

  if (error) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</p>
    );
  }

  return <JobBrowsePanel items={items} />;
}
