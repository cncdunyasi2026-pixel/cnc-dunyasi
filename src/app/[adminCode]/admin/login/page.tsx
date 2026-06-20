import { notFound } from "next/navigation";
import AdminLoginScreen from "@/components/admin/AdminLoginScreen";
import { isValidAdminCode } from "@/lib/admin/adminAccess";

type Props = {
  params: Promise<{ adminCode: string }>;
};

export default async function AdminLoginPage({ params }: Props) {
  const { adminCode } = await params;
  if (!isValidAdminCode(adminCode)) {
    notFound();
  }
  return <AdminLoginScreen adminCode={adminCode} />;
}
