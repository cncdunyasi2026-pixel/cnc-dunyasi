import type { JobListing } from "@/types/job";
import { coerceFirestoreMillis } from "@/lib/firestore/coerceFirestoreMillis";
import { formatListingPostedDate } from "@/lib/utils/format";

export function mapJobListingFromFirestore(id: string, data: Record<string, unknown>): JobListing {
  const images = Array.isArray(data.images) ? (data.images as string[]) : [];
  const createdMs = coerceFirestoreMillis(data.createdAt);
  const responsibilities = Array.isArray(data.responsibilities)
    ? (data.responsibilities as string[]).map(String)
    : [];
  const requirements = Array.isArray(data.requirements)
    ? (data.requirements as string[]).map(String)
    : [];

  const postedAtStr =
    typeof data.postedAt === "string" && data.postedAt.trim()
      ? data.postedAt.trim()
      : formatListingPostedDate(createdMs);

  return {
    id,
    slug: String(data.slug ?? ""),
    title: String(data.title ?? ""),
    company: String(data.company ?? ""),
    location: String(data.location ?? ""),
    workModel: String(data.workModel ?? ""),
    level: String(data.level ?? ""),
    salary: String(data.salary ?? ""),
    postedAt: postedAtStr,
    description: String(data.description ?? ""),
    responsibilities,
    requirements,
    images: images.length > 0 ? images : ["/banner_1.jpg"],
    ...(data.position        ? { position:        String(data.position) }        : {}),
    ...(data.experienceLevel ? { experienceLevel: String(data.experienceLevel) } : {}),
  };
}
