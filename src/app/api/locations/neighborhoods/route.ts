import { NextResponse } from "next/server";
import { getNeighborhoodOptionsByDistrictId } from "@/lib/locations/locationService";

export async function GET(request: Request) {
  const districtId = new URL(request.url).searchParams.get("ilceId");
  if (!districtId) {
    return NextResponse.json({ error: "ilceId gerekli." }, { status: 400 });
  }

  try {
    const neighborhoods = await getNeighborhoodOptionsByDistrictId(districtId);
    return NextResponse.json(neighborhoods);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Mahalle listesi alınamadı." },
      { status: 500 },
    );
  }
}
