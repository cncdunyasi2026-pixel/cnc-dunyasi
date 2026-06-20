import { notFound } from "next/navigation";
import AdminDashboardScreen from "@/components/admin/AdminDashboardScreen";
import { isValidAdminCode } from "@/lib/admin/adminAccess";

type Props = {
  params: Promise<{ adminCode: string }>;
};

export default async function AdminDashboardPage({ params }: Props) {
  const { adminCode } = await params;
  if (!isValidAdminCode(adminCode)) {
    notFound();
  }
  return <AdminDashboardScreen adminCode={adminCode} />;
}
