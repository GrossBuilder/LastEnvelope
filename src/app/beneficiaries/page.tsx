import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BeneficiariesClient } from "@/components/beneficiaries/beneficiaries-client";

export default async function BeneficiariesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <BeneficiariesClient />;
}
