import type { Currency } from "@/types/ad";
import type { LocationSelection } from "@/lib/locations/types";

export type AdListingDraft = {
  userId: string;
  userName: string;
  title: string;
  brand: string;
  model: string;
  price: number;
  currency: Currency;
  location: LocationSelection;
  category: string;
  condition: string;
  year: string;
  powerKw: string;
  tableWidthMm: string;
  tableLengthMm: string;
  axisCount: string;
  sellerType: string;
  trade: string;
  delivery: string;
  description: string;
  files: File[];
  videoFile: File | null;
  labelMissing: boolean;
};

let adDraft: AdListingDraft | null = null;

export function setAdListingDraft(draft: AdListingDraft): void {
  adDraft = draft;
}

export function peekAdListingDraft(userId: string): AdListingDraft | null {
  if (!adDraft || adDraft.userId !== userId) return null;
  return adDraft;
}

export function clearAdListingDraft(): void {
  adDraft = null;
}
