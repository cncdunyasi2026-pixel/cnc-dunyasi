import { notFound } from "next/navigation";
import AuditLogScreen from "@/components/admin/AuditLogScreen";
import { isValidAdminCode } from "@/lib/admin/adminAccess";

type Props = {
  params: Promise<{ adminCode: string }>;
};

export default async function AuditLogPage({ params }: Props) {
  const { adminCode } = await params;
  if (!isValidAdminCode(adminCode)) {
    notFound();
  }
  return <AuditLogScreen adminCode={adminCode} />;
}
