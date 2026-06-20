import type { ListingLifecycleStatus } from "@/types/listingStatus";

export type MyMarketplaceListingRow = {
  id: string;
  kind: "technical" | "spare";
  slug: string;
  title: string;
  name: string;
  city: string;
  imageUrl?: string;
  status: ListingLifecycleStatus;
  createdAt: number;
  revisionNote?: string;
  revisionFields?: Record<string, string>;
};

export type MyJobListingRow = {
  id: string;
  slug: string;
  title: string;
  company: string;
  imageUrl?: string;
  status: ListingLifecycleStatus;
  createdAt: number;
  revisionNote?: string;
  revisionFields?: Record<string, string>;
};
