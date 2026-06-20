import { NextResponse } from "next/server";
import { getDistrictsByProvinceId } from "@/lib/locations/locationService";

export async function GET(request: Request) {
  const provinceId = new URL(request.url).searchParams.get("ilId");
  if (!provinceId) {
    return NextResponse.json({ error: "ilId gerekli." }, { status: 400 });
  }

  try {
    const districts = await getDistrictsByProvinceId(provinceId);
    return NextResponse.json(districts);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "İlçe listesi alınamadı." },
      { status: 500 },
    );
  }
}
