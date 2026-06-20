import { notFound } from "next/navigation";
import ModerationDetailScreen from "@/components/admin/ModerationDetailScreen";
import { isValidAdminCode } from "@/lib/admin/adminAccess";

type Props = {
  params: Promise<{ adminCode: string; collectionName: string; id: string }>;
};

export default async function ModerationDetailPage({ params }: Props) {
  const { adminCode, collectionName, id } = await params;
  if (!isValidAdminCode(adminCode)) notFound();

  const validCollections = [
    "ads",
    "technical_service_listings",
    "spare_part_listings",
    "job_listings",
  ] as const;
  if (!validCollections.includes(collectionName as (typeof validCollections)[number])) {
    notFound();
  }

  return (
    <ModerationDetailScreen
      adminCode={adminCode}
      collectionName={collectionName as (typeof validCollections)[number]}
      listingId={id}
    />
  );
}
