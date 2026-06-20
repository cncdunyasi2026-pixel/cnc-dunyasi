import type { Ad } from "@/types/ad";

/** Firebase öncesi sabit vitrin ilanları (`/ilan/[slug]` demo kayıtları). */
export function getLegacyListingBySlug(slug: string): Ad | null {
  const now = Date.now();

  const legacyListings: Record<string, Ad> = {
    "makak-j500": {
      id: "makak-j500",
      title: "MAKAK HARIAMS J-500",
      price: 3850000,
      city: "Istanbul",
      district: "Tuzla",
      category: "CNC Dik Isleme",
      images: [
        "https://www.millscnc.co.uk/wp-content/uploads/2022/04/DNM-at-Arrowsmith-scaled-2-875x625.jpg",
        "https://5.imimg.com/data5/SELLER/Default/2022/9/ZX/MW/IA/42338623/global-vertical-machining-center-800-500x500.jpg",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8PUvD-j8-ceW-w5OtcDnZg49wrIXByKO6wQ&s",
      ],
      ownerId: "legacy-1",
      userName: "CNC Dunyasi Galeri",
      createdAt: now - 1000 * 60 * 60 * 24 * 3,
    },
    "doosan-4500": {
      id: "doosan-4500",
      title: "DOOSAN DNM 4500",
      price: 4200000,
      city: "Ankara",
      district: "Sincan",
      category: "CNC Dik Isleme",
      images: [
        "https://5.imimg.com/data5/SELLER/Default/2022/9/ZX/MW/IA/42338623/global-vertical-machining-center-800-500x500.jpg",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8PUvD-j8-ceW-w5OtcDnZg49wrIXByKO6wQ&s",
        "https://www.millscnc.co.uk/wp-content/uploads/2022/04/DNM-at-Arrowsmith-scaled-2-875x625.jpg",
      ],
      ownerId: "legacy-2",
      userName: "Anadolu Makina",
      createdAt: now - 1000 * 60 * 60 * 24 * 5,
    },
    "haas-vf2": {
      id: "haas-vf2",
      title: "HAAS VF-2",
      price: 3450000,
      city: "Izmir",
      district: "Cigli",
      category: "CNC Dik Isleme",
      images: [
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8PUvD-j8-ceW-w5OtcDnZg49wrIXByKO6wQ&s",
        "https://www.millscnc.co.uk/wp-content/uploads/2022/04/DNM-at-Arrowsmith-scaled-2-875x625.jpg",
        "https://5.imimg.com/data5/SELLER/Default/2022/9/ZX/MW/IA/42338623/global-vertical-machining-center-800-500x500.jpg",
      ],
      ownerId: "legacy-3",
      userName: "Ege CNC",
      createdAt: now - 1000 * 60 * 60 * 24 * 6,
    },
    "makino-v56i": {
      id: "makino-v56i",
      title: "MAKINO V56i",
      price: 5150000,
      city: "Bursa",
      district: "Nilufer",
      category: "CNC Dik Isleme",
      images: [
        "https://www.millscnc.co.uk/wp-content/uploads/2022/04/DNM-at-Arrowsmith-scaled-2-875x625.jpg",
        "https://5.imimg.com/data5/SELLER/Default/2022/9/ZX/MW/IA/42338623/global-vertical-machining-center-800-500x500.jpg",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8PUvD-j8-ceW-w5OtcDnZg49wrIXByKO6wQ&s",
      ],
      ownerId: "legacy-4",
      userName: "Marmara Tezgah",
      createdAt: now - 1000 * 60 * 60 * 24 * 7,
    },
  };

  return legacyListings[slug] ?? null;
}
