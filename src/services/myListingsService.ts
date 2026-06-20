import { isFirebaseClientConfigured } from "@/lib/firebase";
import {
  fetchAdsByOwner,
  fetchJobsByOwner,
  fetchSparePartByOwner,
  fetchTechnicalServiceByOwner,
} from "@/lib/firestore/myListings";
import type { Ad } from "@/types/ad";
import type { MyJobListingRow, MyMarketplaceListingRow } from "@/types/myListings";

export type MyListingsBundle = {
  ads: Ad[];
  technical: MyMarketplaceListingRow[];
  spareParts: MyMarketplaceListingRow[];
  jobs: MyJobListingRow[];
};

export async function fetchMyListings(ownerId: string): Promise<MyListingsBundle> {
  if (!isFirebaseClientConfigured) {
    return { ads: [], technical: [], spareParts: [], jobs: [] };
  }

  const [ads, technical, spareParts, jobs] = await Promise.all([
    fetchAdsByOwner(ownerId),
    fetchTechnicalServiceByOwner(ownerId),
    fetchSparePartByOwner(ownerId),
    fetchJobsByOwner(ownerId),
  ]);

  return { ads, technical, spareParts, jobs };
}
