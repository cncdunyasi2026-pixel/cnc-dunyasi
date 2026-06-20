const GENERIC_NEIGHBORHOOD_NAMES = new Set([
  "KÖYÜN KENDİSİ",
  "KÖY İÇİ",
  "MERKEZ",
]);

export function formatNeighborhoodLabel(villageName: string, neighborhoodName: string): string {
  if (GENERIC_NEIGHBORHOOD_NAMES.has(neighborhoodName)) {
    return villageName.replace(/^MERKEZ-/, "");
  }
  return neighborhoodName;
}
