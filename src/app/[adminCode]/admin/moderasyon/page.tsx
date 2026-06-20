import { notFound } from "next/navigation";
import ModerationScreen from "@/components/admin/ModerationScreen";
import { isValidAdminCode } from "@/lib/admin/adminAccess";

type Props = {
  params: Promise<{ adminCode: string }>;
};

export default async function ModerasyonPage({ params }: Props) {
  const { adminCode } = await params;
  if (!isValidAdminCode(adminCode)) {
    notFound();
  }
  return <ModerationScreen adminCode={adminCode} />;
}
