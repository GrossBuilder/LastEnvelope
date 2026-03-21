import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { VaultKeyProvider } from "@/components/vault/vault-key-provider";
import { VaultClient } from "@/components/vault/vault-client";

export default async function VaultPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <VaultKeyProvider>
      <VaultClient />
    </VaultKeyProvider>
  );
}
