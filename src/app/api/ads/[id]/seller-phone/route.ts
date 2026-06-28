import { NextResponse } from "next/server";
import { adminDb, isFirebaseAdminConfigured } from "@/lib/firebaseAdmin";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ phone: null }, { status: 400 });
  }

  if (!isFirebaseAdminConfigured || !adminDb) {
    return NextResponse.json({ phone: null });
  }

  const adSnap = await adminDb.collection("ads").doc(id).get();
  if (!adSnap.exists) {
    return NextResponse.json({ phone: null }, { status: 404 });
  }

  const data = adSnap.data() ?? {};
  const isPublished = !("status" in data) || data.status === "published";
  if (!isPublished) {
    return NextResponse.json({ phone: null }, { status: 404 });
  }

  if (typeof data.phone === "string" && data.phone.trim()) {
    return NextResponse.json({ phone: data.phone.trim() });
  }

  const ownerId =
    (typeof data.ownerId === "string" && data.ownerId) ||
    (typeof data.userId === "string" && data.userId) ||
    "";
  if (!ownerId) {
    return NextResponse.json({ phone: null });
  }

  const userSnap = await adminDb.collection("users").doc(ownerId).get();
  const phone = userSnap.data()?.phone;
  return NextResponse.json({
    phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
  });
}
