import "server-only";

import { mapAdSnapshotToAd } from "@/lib/firestore/mapAdDoc";
import { mapJobListingFromFirestore } from "@/lib/firestore/mapJobDoc";
import { mapMarketplaceDocToProfile } from "@/lib/firestore/mapMarketplaceDoc";
import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebaseAdmin";
import { technicalServiceProfiles, sparePartFirms } from "@/lib/mocks/marketplace";
import { jobListings } from "@/lib/mocks/jobs";
import type { Ad } from "@/types/ad";
import type { JobListing } from "@/types/job";
import type { MarketplaceProfile } from "@/types/marketplace";
import { formatPrice } from "@/lib/utils/format";

export type HomeWeeklyDeal = {
  id: string;
  name: string;
  price: string;
  image: string;
  href: string;
};

export type HomeFeaturedListingCard = {
  id: string;
  title: string;
  detail: string;
  image: string;
  href: string;
};

export type HomePageData = {
  weeklyDeals: HomeWeeklyDeal[];
  featuredListings: HomeFeaturedListingCard[];
  featuredServices: MarketplaceProfile[];
  featuredParts: MarketplaceProfile[];
  featuredJobs: JobListing[];
};

const FALLBACK_WEEKLY: HomeWeeklyDeal[] = [
  {
    id: "deal-1",
    name: "Haas VF-2",
    price: "4.5 M - 5.9 M$",
    image:
      "https://shop.phillipscorp.com/cdn/shop/files/haasvf2-hero_4ac30ce9-0887-4f8c-9de3-4de102b7637c.jpg?v=1710228568&width=1000",
    href: "/ilan/haas-vf2",
  },
  {
    id: "deal-2",
    name: "Doosan DNM 4500",
    price: "3.8 M - 5.1 M$",
    image: "https://cdn.werktuigen.com/data/listing/img/vga/ms/48/78/21341872-01.jpg?v=1772209288",
    href: "/ilan/doosan-4500",
  },
  {
    id: "deal-3",
    name: "Makino V56i",
    price: "4.3 M - 5.3 M$",
    image: "https://img.directindustry.com/images_di/photo-g/22024-13721551.jpg",
    href: "/ilan/makino-v56i",
  },
];

const FALLBACK_FEATURED_LISTINGS: HomeFeaturedListingCard[] = [
  {
    id: "ad-1",
    title: "MAKAK HARIAMS J-500",
    detail: "3.850.000 TL",
    image: "https://www.millscnc.co.uk/wp-content/uploads/2022/04/DNM-at-Arrowsmith-scaled-2-875x625.jpg",
    href: "/ilan/makak-j500",
  },
  {
    id: "ad-2",
    title: "DOOSAN DNM 4500",
    detail: "4.200.000 TL",
    image: "https://5.imimg.com/data5/SELLER/Default/2022/9/ZX/MW/IA/42338623/global-vertical-machining-center-800-500x500.jpg",
    href: "/ilan/doosan-4500",
  },
  {
    id: "ad-3",
    title: "HAAS VF-2",
    detail: "3.450.000 TL",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8PUvD-j8-ceW-w5OtcDnZg49wrIXByKO6wQ&s",
    href: "/ilan/haas-vf2",
  },
  {
    id: "ad-4",
    title: "MAKINO V56i",
    detail: "5.150.000 TL",
    image: "https://img.directindustry.com/images_di/photo-g/22024-13721551.jpg",
    href: "/ilan/makino-v56i",
  },
];

function adToWeeklyDeal(ad: Ad): HomeWeeklyDeal {
  const image = ad.images[0] ?? "/banner_1.jpg";
  return {
    id: ad.id,
    name: ad.title,
    price: formatPrice(ad.price, ad.currency),
    image,
    href: `/ilan/${ad.id}`,
  };
}

function adToFeaturedCard(ad: Ad): HomeFeaturedListingCard {
  const image = ad.images[0] ?? "/banner_1.jpg";
  return {
    id: ad.id,
    title: ad.title,
    detail: formatPrice(ad.price, ad.currency),
    image,
    href: `/ilan/${ad.id}`,
  };
}

async function fetchRecentPublishedAds(limit: number): Promise<Ad[]> {
  if (!adminDb) return [];

  const snap = await adminDb
    .collection("ads")
    .where("status", "==", "published")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((d) => mapAdSnapshotToAd(d.id, d.data() as Record<string, unknown>));
}

async function fetchWeeklyDealAds(limit: number): Promise<Ad[]> {
  if (!adminDb) return [];

  const flagged = await adminDb
    .collection("ads")
    .where("status", "==", "published")
    .where("weeklyDeal", "==", true)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  if (!flagged.empty) {
    return flagged.docs.map((d) => mapAdSnapshotToAd(d.id, d.data() as Record<string, unknown>));
  }

  return fetchRecentPublishedAds(limit);
}

async function fetchFeaturedAds(limit: number): Promise<Ad[]> {
  if (!adminDb) return [];

  const flagged = await adminDb
    .collection("ads")
    .where("status", "==", "published")
    .where("isFeatured", "==", true)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  if (!flagged.empty) {
    return flagged.docs.map((d) => mapAdSnapshotToAd(d.id, d.data() as Record<string, unknown>));
  }

  return fetchRecentPublishedAds(limit);
}

async function fetchPublishedTechnical(limit: number): Promise<MarketplaceProfile[]> {
  if (!adminDb) return [];

  const featured = await adminDb
    .collection("technical_service_listings")
    .where("status", "==", "published")
    .where("isFeatured", "==", true)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  if (!featured.empty) {
    return featured.docs.map((d) => mapMarketplaceDocToProfile(d.id, d.data() as Record<string, unknown>));
  }

  const snap = await adminDb
    .collection("technical_service_listings")
    .where("status", "==", "published")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((d) => mapMarketplaceDocToProfile(d.id, d.data() as Record<string, unknown>));
}

async function fetchPublishedSpare(limit: number): Promise<MarketplaceProfile[]> {
  if (!adminDb) return [];

  const featured = await adminDb
    .collection("spare_part_listings")
    .where("status", "==", "published")
    .where("isFeatured", "==", true)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  if (!featured.empty) {
    return featured.docs.map((d) => mapMarketplaceDocToProfile(d.id, d.data() as Record<string, unknown>));
  }

  const snap = await adminDb
    .collection("spare_part_listings")
    .where("status", "==", "published")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((d) => mapMarketplaceDocToProfile(d.id, d.data() as Record<string, unknown>));
}

async function fetchPublishedJobs(limit: number): Promise<JobListing[]> {
  if (!adminDb) return [];

  const featured = await adminDb
    .collection("job_listings")
    .where("status", "==", "published")
    .where("isFeatured", "==", true)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  if (!featured.empty) {
    return featured.docs.map((d) => mapJobListingFromFirestore(d.id, d.data() as Record<string, unknown>));
  }

  const snap = await adminDb
    .collection("job_listings")
    .where("status", "==", "published")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((d) => mapJobListingFromFirestore(d.id, d.data() as Record<string, unknown>));
}

function mockHomeData(): HomePageData {
  return {
    weeklyDeals: FALLBACK_WEEKLY,
    featuredListings: FALLBACK_FEATURED_LISTINGS,
    featuredServices: [...technicalServiceProfiles.slice(0, 4)],
    featuredParts: [...sparePartFirms.slice(0, 4)],
    featuredJobs: [...jobListings.slice(0, 4)],
  };
}

export async function getHomePageData(): Promise<HomePageData> {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return mockHomeData();
  }

  try {
    const [weeklyAds, featuredAds, services, parts, jobs] = await Promise.all([
      fetchWeeklyDealAds(3),
      fetchFeaturedAds(4),
      fetchPublishedTechnical(4),
      fetchPublishedSpare(4),
      fetchPublishedJobs(4),
    ]);

    return {
      weeklyDeals: weeklyAds.length > 0 ? weeklyAds.map(adToWeeklyDeal) : FALLBACK_WEEKLY,
      featuredListings: featuredAds.length > 0 ? featuredAds.map(adToFeaturedCard) : FALLBACK_FEATURED_LISTINGS,
      featuredServices: services.length > 0 ? services : [...technicalServiceProfiles.slice(0, 4)],
      featuredParts: parts.length > 0 ? parts : [...sparePartFirms.slice(0, 4)],
      featuredJobs: jobs.length > 0 ? jobs : [...jobListings.slice(0, 4)],
    };
  } catch {
    return mockHomeData();
  }
}
