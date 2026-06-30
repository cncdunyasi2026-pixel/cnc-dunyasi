import { notFound } from "next/navigation";
import FooterManagementScreen from "@/components/admin/FooterManagementScreen";
import { isValidAdminCode } from "@/lib/admin/adminAccess";

type Props = {
  params: Promise<{ adminCode: string }>;
};

export default async function AdminFooterPage({ params }: Props) {
  const { adminCode } = await params;
  if (!isValidAdminCode(adminCode)) {
    notFound();
  }
  return <FooterManagementScreen adminCode={adminCode} />;
}
