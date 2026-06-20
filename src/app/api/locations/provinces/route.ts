import { NextResponse } from "next/server";
import { getProvinces } from "@/lib/locations/locationService";

export async function GET() {
  try {
    const provinces = await getProvinces();
    return NextResponse.json(provinces);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "İl listesi alınamadı." },
      { status: 500 },
    );
  }
}
