import { NextResponse } from "next/server";
import { readLegalMarkdown } from "@/lib/legal/readLegalMarkdown.server";

export async function GET() {
  const kvkk = readLegalMarkdown("kvkk");
  const userAgreement = readLegalMarkdown("userAgreement");

  return NextResponse.json({
    kvkk,
    userAgreement,
  });
}
