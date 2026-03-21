"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Props {
  editData: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    relation: string | null;
  } | null;
  onClose: () => void;
  onSaved: () => void;
}

export function BeneficiaryModal({ editData, onClose, onSaved }: Props) {
  const { t } = useI18n();
  const [name, setName] = useState(editData?.name ?? "");
  const [email, setEmail] = useState(editData?.email ?? "");
  const [phone, setPhone] = useState(editData?.phone ?? "");
  const [relation, setRelation] = useState(editData?.relation ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = editData
        ? `/api/beneficiaries/${editData.id}`
        : "/api/beneficiaries";
      const method = editData ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, relation }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t.beneficiaries.failedToSave);
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.beneficiaries.failedToSave);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">
            {editData ? t.beneficiaries.editBeneficiary : t.beneficiaries.addBeneficiary}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-950/50 border border-red-800/50 text-red-400 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              {t.beneficiaries.nameLabel}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-600 transition"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              {t.beneficiaries.emailLabel}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-600 transition"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              {t.beneficiaries.phoneLabel}{" "}
              <span className="text-zinc-500 font-normal">{t.common.optional}</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={20}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-600 transition"
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              {t.beneficiaries.relationLabel}{" "}
              <span className="text-zinc-500 font-normal">{t.common.optional}</span>
            </label>
            <select
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-600 transition"
            >
              <option value="">{t.beneficiaries.selectRelation}</option>
              {t.beneficiaries.relationOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

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
              disabled={loading || !name.trim() || !email.trim()}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.beneficiaries.savingBeneficiary}
                </>
              ) : editData ? (
                t.beneficiaries.updateBeneficiary
              ) : (
                t.beneficiaries.addBeneficiary
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
