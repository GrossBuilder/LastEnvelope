"use client";

import { useState } from "react";
import { useVaultKey } from "./vault-key-provider";
import { encrypt } from "@/lib/crypto";
import { X, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type VaultType = "PASSWORD" | "DOCUMENT" | "MESSAGE" | "INSTRUCTION";

interface Props {
  editItem: { id: string; type: VaultType; title: string } | null;
  onClose: () => void;
  onSaved: () => void;
}

export function VaultItemModal({ editItem, onClose, onSaved }: Props) {
  const { cryptoKey } = useVaultKey();
  const { t } = useI18n();

  const typeOptions: { value: VaultType; label: string }[] = [
    { value: "PASSWORD", label: t.vault.typePassword },
    { value: "DOCUMENT", label: t.vault.typeDocument },
    { value: "MESSAGE", label: t.vault.typeMessage },
    { value: "INSTRUCTION", label: t.vault.typeInstruction },
  ];

  const [type, setType] = useState<VaultType>(editItem?.type ?? "PASSWORD");
  const [title, setTitle] = useState(editItem?.title ?? "");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cryptoKey) return;

    setError("");
    setLoading(true);

    try {
      const { ciphertext, iv } = await encrypt(content, cryptoKey);

      const url = editItem ? `/api/vault/${editItem.id}` : "/api/vault";
      const method = editItem ? "PATCH" : "POST";

      const body = editItem
        ? { title, encryptedData: ciphertext, iv }
        : { type, title, encryptedData: ciphertext, iv };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t.vault.failedToSave);
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.vault.failedToSave);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">
            {editItem ? t.vault.editItem : t.vault.addVaultItem}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-950/50 border border-red-800/50 text-red-400 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Type */}
          {!editItem && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                {t.vault.type}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {typeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                      type === opt.value
                        ? "bg-emerald-600 text-white"
                        : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              {t.vault.titleLabel}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-600 transition"
              placeholder={t.vault.titlePlaceholder}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              {t.vault.content}{" "}
              <span className="text-zinc-500 font-normal">
                {t.vault.contentHint}
              </span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={8}
              className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-600 transition resize-none font-mono text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !content.trim()}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.vault.saving}
                </>
              ) : editItem ? (
                t.common.update
              ) : (
                t.vault.saveItem
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
