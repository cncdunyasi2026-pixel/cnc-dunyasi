"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getRelatedJobListings } from "@/services/jobListingService";
import type { JobListing } from "@/types/job";

type Props = {
  current: JobListing;
};

function RelatedJobCard({ job }: { job: JobListing }) {
  return (
    <Link
      href={`/kariyer/${job.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[10px] border border-[#dbe2ea] bg-white p-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <img
        src={job.images[0] ?? "/banner_1.jpg"}
        alt={job.title}
        className="h-32 w-full rounded-[8px] bg-[#f4f6f9] object-cover sm:h-36"
      />
      <div className="flex flex-1 flex-col pt-2">
        <h3 className="line-clamp-2 text-sm font-black leading-tight text-[#0F2A4A] sm:text-base">
          {job.title}
        </h3>
        <p className="mt-1 line-clamp-1 text-xs font-semibold text-[#1f334e] sm:text-sm">{job.company}</p>
        <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] text-[#7A8CA5] sm:text-xs">
          <span className="rounded-full bg-[#edf1f6] px-2 py-1">{job.location}</span>
          <span className="rounded-full bg-[#edf1f6] px-2 py-1">{job.workModel}</span>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <p className="line-clamp-1 text-xs font-extrabold text-[#0F2A4A] sm:text-sm">{job.salary}</p>
          <span className="rounded-[8px] bg-[#F26A1B] px-2 py-1 text-[10px] font-bold !text-white sm:px-3 sm:py-1.5 sm:text-xs">
            İncele
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function RelatedJobsSection({ current }: Props) {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void getRelatedJobListings(current, 4)
      .then((results) => {
        if (!cancelled) setJobs(results);
      })
      .catch(() => {
        if (!cancelled) setJobs([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [current.id, current.slug, current.title, current.position, current.workModel]);

  if (!loading && jobs.length === 0) return null;

  const subtitle = current.position ?? current.title;

  return (
    <section className="mx-auto w-full max-w-7xl border-t border-[#e8edf3] px-4 pb-8 pt-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-extrabold text-[#0F2A4A] sm:text-xl">Benzer iş ilanları</h2>
          {subtitle ? <p className="mt-1 text-sm text-[#7A8CA5]">{subtitle}</p> : null}
        </div>
        <Link href="/kariyer" className="text-sm font-semibold text-[#F26A1B] transition hover:underline">
          Tüm ilanlar
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-56 animate-pulse rounded-[10px] border border-[#dbe2ea] bg-[#f4f6f9]"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {jobs.map((job) => (
            <RelatedJobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </section>
  );
}
