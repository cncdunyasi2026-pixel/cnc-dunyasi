import { NextResponse } from "next/server";
import { getHomeSectionsData } from "@/services/homeServerService";
import { toJsonSafe } from "@/lib/utils/jsonSafe";

/** Anasayfa ilan verisi — CDN önbelleği (5 dk taze, 1 saat stale) */
const HOME_SECTIONS_CACHE_CONTROL = "public, max-age=300, stale-while-revalidate=3600";

export async function GET() {
  try {
    const data = await getHomeSectionsData();
    if (!data) {
      return NextResponse.json(
        { error: "Anasayfa verisi şu an sunucudan alınamadı." },
        { status: 503 },
      );
    }

    return NextResponse.json(toJsonSafe(data), {
      headers: { "Cache-Control": HOME_SECTIONS_CACHE_CONTROL },
    });
  } catch (error) {
    console.error("[api/home/sections]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Anasayfa verisi alınamadı." },
      { status: 500 },
    );
  }
}
