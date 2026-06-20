import { notFound } from "next/navigation";
import ReportsScreen from "@/components/admin/ReportsScreen";
import { isValidAdminCode } from "@/lib/admin/adminAccess";

type Props = {
  params: Promise<{ adminCode: string }>;
};

export default async function RaporlarPage({ params }: Props) {
  const { adminCode } = await params;
  if (!isValidAdminCode(adminCode)) {
    notFound();
  }
  return <ReportsScreen adminCode={adminCode} />;
}
