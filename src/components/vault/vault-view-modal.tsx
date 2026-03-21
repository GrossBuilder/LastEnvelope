"use client";

import { useState, useEffect } from "react";
import { useVaultKey } from "./vault-key-provider";
import { decrypt } from "@/lib/crypto";
import { X, Loader2, Copy, Check, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Props {
  itemId: string;
  onClose: () => void;
}

export function VaultViewModal({ itemId, onClose }: Props) {
  const { cryptoKey } = useVaultKey();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [decrypted, setDecrypted] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      if (!cryptoKey) return;

      try {
        const res = await fetch(`/api/vault/${itemId}`);
        if (!res.ok) throw new Error("Failed to fetch");

        const { item } = await res.json();
        setTitle(item.title);
        setType(item.type);

        const plaintext = await decrypt(item.encryptedData, item.iv, cryptoKey);
        setDecrypted(plaintext);
      } catch {
        setError(t.vault.decryptError);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [itemId, cryptoKey]);

  async function handleCopy() {
    if (!decrypted) return;
    await navigator.clipboard.writeText(decrypted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-white">{title || t.common.loading}</h2>
            {type && (
              <p className="text-xs text-zinc-500 mt-0.5">{type}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
              <span className="ml-3 text-zinc-400">{t.vault.decrypting}</span>
            </div>
          ) : error ? (
            <div className="bg-red-950/50 border border-red-800/50 text-red-400 text-sm p-4 rounded-xl">
              {error}
            </div>
          ) : (
            <>
              <div className="relative">
                <pre className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-sm text-zinc-200 font-mono whitespace-pre-wrap break-words max-h-80 overflow-y-auto">
                  {decrypted}
                </pre>
                <button
                  onClick={handleCopy}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-zinc-700 text-zinc-400 hover:text-white transition"
                  title={t.vault.copyToClipboard}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 mt-4 text-xs text-zinc-500">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                {t.vault.decryptedLocally}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end p-6 pt-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  );
}
