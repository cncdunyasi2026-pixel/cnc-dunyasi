"use client";

import { use } from "react";
import JobDetailLoader from "@/components/jobs/JobDetailLoader";
import { jobListings } from "@/lib/mocks/jobs";

type Props = {
  params: Promise<{ slug: string }>;
};

export default function CareerDetailPage({ params }: Props) {
  const { slug } = use(params);
  const legacyJob = jobListings.find((item) => item.slug === slug) ?? null;

  return <JobDetailLoader slug={slug} publishedJob={null} legacyJob={legacyJob} />;
}
