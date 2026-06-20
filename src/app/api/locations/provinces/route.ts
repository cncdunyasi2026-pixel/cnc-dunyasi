import { NextResponse } from "next/server";
import { getProvinces } from "@/lib/locations/locationService";
import { LOCATION_HTTP_CACHE_CONTROL } from "@/lib/cache/locationCache";

export async function GET() {
  try {
    const provinces = await getProvinces();
    return NextResponse.json(provinces, {
      headers: { "Cache-Control": LOCATION_HTTP_CACHE_CONTROL },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "İl listesi alınamadı." },
      { status: 500 },
    );
  }
}
