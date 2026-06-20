import { notFound } from "next/navigation";
import PageManagementScreen from "@/components/admin/PageManagementScreen";
import { isValidAdminCode } from "@/lib/admin/adminAccess";

type Props = {
  params: Promise<{ adminCode: string }>;
};

export default async function AdminPageManagementPage({ params }: Props) {
  const { adminCode } = await params;
  if (!isValidAdminCode(adminCode)) {
    notFound();
  }
  return <PageManagementScreen adminCode={adminCode} />;
}
