"use client";

import { useState, useEffect } from "react";
import {
  X,
  Loader2,
  Key,
  FileText,
  MessageSquare,
  ClipboardList,
  Check,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

type VaultItemSummary = {
  id: string;
  type: string;
  title: string;
};

interface Props {
  beneficiary: {
    id: string;
    name: string;
    items: { vaultItem: { id: string } }[];
  };
  onClose: () => void;
  onAssigned: () => void;
}

const typeIcons: Record<string, typeof Key> = {
  PASSWORD: Key,
  DOCUMENT: FileText,
  MESSAGE: MessageSquare,
  INSTRUCTION: ClipboardList,
};

export function AssignItemsModal({ beneficiary, onClose, onAssigned }: Props) {
  const { t } = useI18n();
  const [vaultItems, setVaultItems] = useState<VaultItemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);

  const assignedIds = new Set(beneficiary.items.map((i) => i.vaultItem.id));

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/vault");
      if (res.ok) {
        const data = await res.json();
        setVaultItems(data.items);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleAssign(vaultItemId: string) {
    setAssigning(vaultItemId);
    const res = await fetch(`/api/beneficiaries/${beneficiary.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vaultItemId }),
    });

    if (res.ok) {
      onAssigned();
    }
    setAssigning(null);
  }

  const unassigned = vaultItems.filter((v) => !assignedIds.has(v.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-white">{t.beneficiaries.assignTitle}</h2>
            <p className="text-sm text-zinc-400 mt-0.5">
              {t.beneficiaries.assignTo} {beneficiary.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
            </div>
          ) : vaultItems.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">
              {t.beneficiaries.noVaultItems}
            </p>
          ) : unassigned.length === 0 ? (
            <div className="text-center py-8">
              <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-zinc-300">{t.beneficiaries.allAssigned}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {unassigned.map((item) => {
                const Icon = typeIcons[item.type] || FileText;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleAssign(item.id)}
                    disabled={assigning === item.id}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition disabled:opacity-50 text-left"
                  >
                    <Icon className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-zinc-500">{item.type}</p>
                    </div>
                    {assigning === item.id ? (
                      <Loader2 className="w-4 h-4 text-zinc-400 animate-spin shrink-0" />
                    ) : (
                      <span className="text-xs text-emerald-400 shrink-0">
                        {t.beneficiaries.assignButton}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 pt-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
          >
            {t.common.done}
          </button>
        </div>
      </div>
    </div>
  );
}
