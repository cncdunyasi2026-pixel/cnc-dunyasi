import { notFound } from "next/navigation";
import BroadcastEmailScreen from "@/components/admin/BroadcastEmailScreen";
import { isValidAdminCode } from "@/lib/admin/adminAccess";

type Props = {
  params: Promise<{ adminCode: string }>;
};

export default async function AdminBroadcastEmailPage({ params }: Props) {
  const { adminCode } = await params;
  if (!isValidAdminCode(adminCode)) {
    notFound();
  }
  return <BroadcastEmailScreen adminCode={adminCode} />;
}
