import { NextResponse } from "next/server";
import { isFirebaseAdminConfigured } from "@/lib/firebaseAdmin";
import { searchPublishedAdsAdmin } from "@/lib/firestore/searchAdsAdmin";
import type { AdServerFilters } from "@/types/adBrowse";

function parseListParam(value: string | null): string[] | undefined {
  if (!value?.trim()) return undefined;
  const items = value.split(",").map((item) => item.trim()).filter(Boolean);
  return items.length > 0 ? items.slice(0, 30) : undefined;
}

function parseFilters(searchParams: URLSearchParams): AdServerFilters {
  const city = searchParams.get("city")?.trim();
  const category = searchParams.get("category")?.trim();
  const brand = searchParams.get("brand")?.trim();

  return {
    city: city || undefined,
    cities: parseListParam(searchParams.get("cities")),
    category: category || undefined,
    categories: parseListParam(searchParams.get("categories")),
    brand: brand || undefined,
    brands: parseListParam(searchParams.get("brands")),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (!q) {
    return NextResponse.json({ ads: [], total: 0 });
  }

  if (q.length > 120) {
    return NextResponse.json({ error: "Arama metni çok uzun." }, { status: 400 });
  }

  if (!isFirebaseAdminConfigured) {
    return NextResponse.json(
      { error: "Sunucu araması yapılandırılmamış. FIREBASE_* ortam değişkenlerini kontrol edin." },
      { status: 503 },
    );
  }

  try {
    const filters = parseFilters(searchParams);
    const ads = await searchPublishedAdsAdmin(q, filters);
    return NextResponse.json(
      { ads, total: ads.length },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Arama başarısız." },
      { status: 500 },
    );
  }
}
