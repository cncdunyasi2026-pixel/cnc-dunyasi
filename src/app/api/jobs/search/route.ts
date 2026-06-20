import { NextResponse } from "next/server";
import { isFirebaseAdminConfigured } from "@/lib/firebaseAdmin";
import { searchPublishedJobsAdmin } from "@/lib/firestore/searchJobsAdmin";
import type { JobSearchFilters } from "@/lib/utils/jobSearch";

function parseListParam(value: string | null): string[] | undefined {
  if (!value?.trim()) return undefined;
  const items = value.split(",").map((item) => item.trim()).filter(Boolean);
  return items.length > 0 ? items.slice(0, 30) : undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (!q) {
    return NextResponse.json({ jobs: [], total: 0 });
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

  const filters: JobSearchFilters = {
    workModels: parseListParam(searchParams.get("workModels")),
    positions: parseListParam(searchParams.get("positions")),
    experienceLevels: parseListParam(searchParams.get("experienceLevels")),
    cities: parseListParam(searchParams.get("cities")),
  };

  try {
    const jobs = await searchPublishedJobsAdmin(q, filters);
    return NextResponse.json(
      { jobs, total: jobs.length },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Arama başarısız." },
      { status: 500 },
    );
  }
}
