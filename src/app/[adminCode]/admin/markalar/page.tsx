import { notFound } from "next/navigation";
import BrandsScreen from "@/components/admin/BrandsScreen";
import { isValidAdminCode } from "@/lib/admin/adminAccess";

type Props = {
  params: Promise<{ adminCode: string }>;
};

export default async function AdminCncDataPage({ params }: Props) {
  const { adminCode } = await params;
  if (!isValidAdminCode(adminCode)) {
    notFound();
  }
  return <BrandsScreen adminCode={adminCode} />;
}
