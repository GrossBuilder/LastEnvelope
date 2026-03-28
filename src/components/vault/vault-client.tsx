"use client";

import { useState, useEffect, useCallback } from "react";
import { useVaultKey } from "./vault-key-provider";
import { UnlockVault } from "./unlock-vault";
import { VaultItemModal } from "./vault-item-modal";
import { VaultViewModal } from "./vault-view-modal";
import {
  Plus,
  Lock,
  Key,
  FileText,
  MessageSquare,
  ClipboardList,
  Trash2,
  Eye,
  Pencil,
  LockOpen,
  Loader2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

type VaultItemSummary = {
  id: string;
  type: "PASSWORD" | "DOCUMENT" | "MESSAGE" | "INSTRUCTION";
  title: string;
  createdAt: string;
  updatedAt: string;
};

const typeIcons = {
  PASSWORD: Key,
  DOCUMENT: FileText,
  MESSAGE: MessageSquare,
  INSTRUCTION: ClipboardList,
};

const typeColors = {
  PASSWORD: "text-amber-400",
  DOCUMENT: "text-blue-400",
  MESSAGE: "text-violet-400",
  INSTRUCTION: "text-emerald-400",
};

export function VaultClient() {
  const { isUnlocked, lock } = useVaultKey();
  const { t } = useI18n();
  const [items, setItems] = useState<VaultItemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editItem, setEditItem] = useState<VaultItemSummary | null>(null);
  const [viewItemId, setViewItemId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/vault");
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  if (!isUnlocked) {
    return <UnlockVault />;
  }

  async function handleDelete(id: string) {
    if (!confirm(t.vault.deleteConfirm)) return;
    setDeleting(id);
    const res = await fetch(`/api/vault/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
    setDeleting(null);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">{t.vault.title}</h1>
          <p className="text-zinc-400 mt-1">{t.vault.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={lock}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
          >
            <LockOpen className="w-4 h-4" />
            {t.vault.lock}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition"
          >
            <Plus className="w-4 h-4" />
            {t.vault.addItem}
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <Lock className="w-12 h-12 text-zinc-600 mb-4" />
          <h2 className="text-xl font-semibold text-zinc-300 mb-2">
            {t.vault.emptyTitle}
          </h2>
          <p className="text-zinc-500 text-center max-w-md mb-6">
            {t.vault.emptyDesc}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition"
          >
            <Plus className="w-4 h-4" />
            {t.vault.addFirstItem}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = typeIcons[item.type];
            return (
              <div
                key={item.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between hover:border-zinc-700 transition group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${typeColors[item.type]}`} />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{item.title}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {({PASSWORD: t.vault.typePassword, DOCUMENT: t.vault.typeDocument, MESSAGE: t.vault.typeMessage, INSTRUCTION: t.vault.typeInstruction} as Record<string, string>)[item.type]} · {t.vault.updated}{" "}
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => setViewItemId(item.id)}
                    className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition"
                    title={t.common.view}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditItem(item)}
                    className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition"
                    title={t.common.edit}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deleting === item.id}
                    className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 transition disabled:opacity-50"
                    title={t.common.delete}
                  >
                    {deleting === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit modal */}
      {(showCreateModal || editItem) && (
        <VaultItemModal
          editItem={editItem}
          onClose={() => {
            setShowCreateModal(false);
            setEditItem(null);
          }}
          onSaved={() => {
            setShowCreateModal(false);
            setEditItem(null);
            fetchItems();
          }}
        />
      )}

      {/* View modal */}
      {viewItemId && (
        <VaultViewModal
          itemId={viewItemId}
          onClose={() => setViewItemId(null)}
        />
      )}
    </div>
  );
}
