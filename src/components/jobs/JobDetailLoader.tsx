"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import JobDetailContent from "@/components/jobs/JobDetailContent";
import RelatedJobsSection from "@/components/jobs/RelatedJobsSection";
import { getJobListingBySlugClient } from "@/lib/firestore/jobListings";
import type { JobListing } from "@/types/job";

type Props = {
  slug: string;
  publishedJob: JobListing | null;
  legacyJob: JobListing | null;
};

export default function JobDetailLoader({ slug, publishedJob, legacyJob }: Props) {
  const [clientJob, setClientJob] = useState<JobListing | null | undefined>(undefined);

  useEffect(() => {
    if (publishedJob || legacyJob) {
      setClientJob(null);
      return;
    }

    let cancelled = false;
    void getJobListingBySlugClient(slug).then((job) => {
      if (!cancelled) setClientJob(job ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [slug, publishedJob, legacyJob]);

  const job =
    publishedJob ?? legacyJob ?? (clientJob === undefined ? undefined : clientJob);

  if (job === undefined) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm font-semibold text-[#7A8CA5]">Yükleniyor...</p>
      </div>
    );
  }

  if (job === null) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-bold text-[#0F2A4A]">İlan bulunamadı</p>
        <Link href="/kariyer" className="mt-4 inline-block text-sm font-semibold text-[#F26A1B] hover:underline">
          Kariyer ilanlarına dön
        </Link>
      </div>
    );
  }

  return (
    <>
      <JobDetailContent job={job} />
      <RelatedJobsSection current={job} />
    </>
  );
}
