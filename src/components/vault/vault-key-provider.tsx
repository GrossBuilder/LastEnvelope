"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { deriveKey } from "@/lib/crypto";
import { useSession } from "next-auth/react";

interface VaultKeyContextType {
  cryptoKey: CryptoKey | null;
  isUnlocked: boolean;
  unlock: (passphrase: string) => Promise<void>;
  lock: () => void;
}

const VaultKeyContext = createContext<VaultKeyContextType | null>(null);

export function VaultKeyProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);

  const unlock = useCallback(
    async (passphrase: string) => {
      if (!session?.user?.id) throw new Error("Not authenticated");
      const key = await deriveKey(passphrase, session.user.id);
      setCryptoKey(key);
    },
    [session?.user?.id]
  );

  const lock = useCallback(() => {
    setCryptoKey(null);
  }, []);

  return (
    <VaultKeyContext.Provider
      value={{ cryptoKey, isUnlocked: !!cryptoKey, unlock, lock }}
    >
      {children}
    </VaultKeyContext.Provider>
  );
}

export function useVaultKey() {
  const ctx = useContext(VaultKeyContext);
  if (!ctx) throw new Error("useVaultKey must be used within VaultKeyProvider");
  return ctx;
}
