import { notFound } from "next/navigation";
import HomepageScreen from "@/components/admin/HomepageScreen";
import { isValidAdminCode } from "@/lib/admin/adminAccess";

type Props = {
  params: Promise<{ adminCode: string }>;
};

export default async function AdminHomepagePage({ params }: Props) {
  const { adminCode } = await params;
  if (!isValidAdminCode(adminCode)) {
    notFound();
  }
  return <HomepageScreen adminCode={adminCode} />;
}
