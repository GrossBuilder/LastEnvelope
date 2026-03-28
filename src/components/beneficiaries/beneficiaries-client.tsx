"use client";

import { useState, useEffect, useCallback } from "react";
import { BeneficiaryModal } from "./beneficiary-modal";
import { AssignItemsModal } from "./assign-items-modal";
import {
  Plus,
  Users,
  Mail,
  Phone,
  Heart,
  Pencil,
  Trash2,
  Package,
  Loader2,
  Key,
  FileText,
  MessageSquare,
  ClipboardList,
  X,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

type VaultItemRef = { id: string; title: string; type: string };
type BeneficiaryItemRef = { id: string; note: string | null; vaultItem: VaultItemRef };

type Beneficiary = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  relation: string | null;
  createdAt: string;
  items: BeneficiaryItemRef[];
};

const vaultTypeIcons: Record<string, typeof Key> = {
  PASSWORD: Key,
  DOCUMENT: FileText,
  MESSAGE: MessageSquare,
  INSTRUCTION: ClipboardList,
};

export function BeneficiariesClient() {
  const { t } = useI18n();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editBeneficiary, setEditBeneficiary] = useState<Beneficiary | null>(null);
  const [assignBeneficiary, setAssignBeneficiary] = useState<Beneficiary | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [removingItem, setRemovingItem] = useState<string | null>(null);

  const fetchBeneficiaries = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/beneficiaries");
    if (res.ok) {
      const data = await res.json();
      setBeneficiaries(data.beneficiaries);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBeneficiaries();
  }, [fetchBeneficiaries]);

  async function handleDelete(id: string) {
    if (!confirm(t.beneficiaries.deleteConfirm)) return;
    setDeleting(id);
    const res = await fetch(`/api/beneficiaries/${id}`, { method: "DELETE" });
    if (res.ok) {
      setBeneficiaries((prev) => prev.filter((b) => b.id !== id));
    }
    setDeleting(null);
  }

  async function handleRemoveItem(beneficiaryId: string, assignmentId: string) {
    setRemovingItem(assignmentId);
    const res = await fetch(`/api/beneficiaries/${beneficiaryId}/items/${assignmentId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setBeneficiaries((prev) =>
        prev.map((b) =>
          b.id === beneficiaryId
            ? { ...b, items: b.items.filter((i) => i.id !== assignmentId) }
            : b
        )
      );
    }
    setRemovingItem(null);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">{t.beneficiaries.title}</h1>
          <p className="text-zinc-400 mt-1">{t.beneficiaries.subtitle}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition"
        >
          <Plus className="w-4 h-4" />
          {t.beneficiaries.addBeneficiary}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
        </div>
      ) : beneficiaries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <Users className="w-12 h-12 text-zinc-600 mb-4" />
          <h2 className="text-xl font-semibold text-zinc-300 mb-2">
            {t.beneficiaries.emptyTitle}
          </h2>
          <p className="text-zinc-500 text-center max-w-md mb-6">
            {t.beneficiaries.emptyDesc}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition"
          >
            <Plus className="w-4 h-4" />
            {t.beneficiaries.addFirst}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {beneficiaries.map((b) => (
            <div
              key={b.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition"
            >
              {/* Beneficiary header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-lg font-bold text-emerald-400">
                    {b.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{b.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-sm text-zinc-400">
                        <Mail className="w-3.5 h-3.5" />
                        {b.email}
                      </span>
                      {b.phone && (
                        <span className="flex items-center gap-1 text-sm text-zinc-400">
                          <Phone className="w-3.5 h-3.5" />
                          {b.phone}
                        </span>
                      )}
                      {b.relation && (
                        <span className="flex items-center gap-1 text-sm text-zinc-400">
                          <Heart className="w-3.5 h-3.5" />
                          {b.relation}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAssignBeneficiary(b)}
                    className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-700 transition"
                    title={t.beneficiaries.assignVaultItems}
                  >
                    <Package className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditBeneficiary(b)}
                    className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition"
                    title={t.common.edit}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    disabled={deleting === b.id}
                    className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 transition disabled:opacity-50"
                    title={t.common.delete}
                  >
                    {deleting === b.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Assigned items */}
              {b.items.length > 0 ? (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">
                    {t.beneficiaries.assignedItems} ({b.items.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {b.items.map((assignment) => {
                      const Icon = vaultTypeIcons[assignment.vaultItem.type] || FileText;
                      return (
                        <div
                          key={assignment.id}
                          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-lg text-sm group"
                        >
                          <Icon className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-zinc-300">{assignment.vaultItem.title}</span>
                          <button
                            onClick={() => handleRemoveItem(b.id, assignment.id)}
                            disabled={removingItem === assignment.id}
                            className="text-zinc-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                          >
                            {removingItem === assignment.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <X className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <p className="text-sm text-zinc-500 italic">
                    {t.beneficiaries.noItemsAssigned}{" "}
                    <button
                      onClick={() => setAssignBeneficiary(b)}
                      className="text-emerald-400 hover:text-emerald-300 not-italic"
                    >
                      {t.beneficiaries.assignItems}
                    </button>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      {(showCreateModal || editBeneficiary) && (
        <BeneficiaryModal
          editData={editBeneficiary}
          onClose={() => {
            setShowCreateModal(false);
            setEditBeneficiary(null);
          }}
          onSaved={() => {
            setShowCreateModal(false);
            setEditBeneficiary(null);
            fetchBeneficiaries();
          }}
        />
      )}

      {/* Assign items modal */}
      {assignBeneficiary && (
        <AssignItemsModal
          beneficiary={assignBeneficiary}
          onClose={() => setAssignBeneficiary(null)}
          onAssigned={() => {
            setAssignBeneficiary(null);
            fetchBeneficiaries();
          }}
        />
      )}
    </div>
  );
}
