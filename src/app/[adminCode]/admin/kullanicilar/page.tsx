import { notFound } from "next/navigation";
import UsersScreen from "@/components/admin/UsersScreen";
import { isValidAdminCode } from "@/lib/admin/adminAccess";

type Props = {
  params: Promise<{ adminCode: string }>;
};

export default async function AdminUsersPage({ params }: Props) {
  const { adminCode } = await params;
  if (!isValidAdminCode(adminCode)) {
    notFound();
  }
  return <UsersScreen adminCode={adminCode} />;
}
