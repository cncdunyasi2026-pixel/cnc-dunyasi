import { NextResponse } from "next/server";
import { isFirebaseAdminConfigured } from "@/lib/firebaseAdmin";
import { searchPublishedMarketplaceAdmin } from "@/lib/firestore/searchMarketplaceAdmin";
import type { MarketplaceSearchFilters } from "@/lib/utils/marketplaceSearch";

function parseListParam(value: string | null): string[] | undefined {
  if (!value?.trim()) return undefined;
  const items = value.split(",").map((item) => item.trim()).filter(Boolean);
  return items.length > 0 ? items.slice(0, 30) : undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const variant = searchParams.get("variant");

  if (!q) {
    return NextResponse.json({ items: [], total: 0 });
  }

  if (variant !== "technical" && variant !== "spare") {
    return NextResponse.json({ error: "variant=technical|spare gerekli." }, { status: 400 });
  }

  if (q.length > 120) {
    return NextResponse.json({ error: "Arama metni çok uzun." }, { status: 400 });
  }

  if (!isFirebaseAdminConfigured) {
    return NextResponse.json(
      { error: "Sunucu araması yapılandırılmamış." },
      { status: 503 },
    );
  }

  const filters: MarketplaceSearchFilters = {
    serviceTypes: parseListParam(searchParams.get("serviceTypes")),
    expertiseBrands: parseListParam(searchParams.get("expertiseBrands")),
    partCategories: parseListParam(searchParams.get("partCategories")),
    brandCompats: parseListParam(searchParams.get("brandCompats")),
    cities: parseListParam(searchParams.get("cities")),
  };

  try {
    const items = await searchPublishedMarketplaceAdmin(variant, q, filters);
    return NextResponse.json(
      { items, total: items.length },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Arama başarısız." },
      { status: 500 },
    );
  }
}
