"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { useAdminI18n } from "@/app/admin/admin-shell";

interface Ticket {
  id: string;
  userId: string;
  subject: string;
  category: string;
  message: string;
  status: string;
  priority: string;
  createdAt: string;
  user: {
    name?: string;
    email: string;
  };
  replies: Array<{
    id: string;
    message: string;
    createdAt: string;
    user?: {
      email: string;
    };
  }>;
  files: Array<{
    id: string;
    originalName: string;
    size: number;
    storagePath: string;
  }>;
}

interface TicketsClientProps {
  initialTickets: Ticket[];
}

export function TicketsClient({ initialTickets }: TicketsClientProps) {
  const { t } = useAdminI18n();
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(
    initialTickets[0] || null
  );
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredTickets =
    statusFilter === "ALL"
      ? tickets
      : tickets.filter((t) => t.status === statusFilter);

  const handleStatusChange = async (ticketId: string, newStatus: string): Promise<void> => {
    try {
      const response = await fetch(
        `/api/admin/support/tickets/${ticketId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) throw new Error("Failed to update status");

      setTickets(
        tickets.map((t) =>
          t.id === ticketId ? { ...t, status: newStatus } : t
        )
      );

      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating ticket:", error);
    }
  };

  const handleReply = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!selectedTicket || !reply.trim()) return;

    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/support/tickets/${selectedTicket.id}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: reply }),
        }
      );

      if (!response.ok) throw new Error("Failed to send reply");

      const newReply = await response.json();
      const updatedTicket = {
        ...selectedTicket,
        replies: [...selectedTicket.replies, newReply],
      };

      setSelectedTicket(updatedTicket);
      setTickets(
        tickets.map((t) =>
          t.id === selectedTicket.id ? updatedTicket : t
        )
      );
      setReply("");
    } catch (error) {
      console.error("Error sending reply:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-white">{t.support.title}</h1>
      <div className="flex gap-6">
      {/* Tickets List */}
      <div className="flex-1 max-w-md">
        <div className="mb-4">
          <select
            aria-label={t.support.filterLabel}
            value={statusFilter}
            onChange={(e): void => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">{t.support.allStatuses}</option>
            <option value="NEW">{t.support.statusNew}</option>
            <option value="IN_PROGRESS">{t.support.statusInProgress}</option>
            <option value="RESOLVED">{t.support.statusResolved}</option>
            <option value="CLOSED">{t.support.statusClosed}</option>
          </select>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className={`p-3 border rounded cursor-pointer transition ${
                selectedTicket?.id === ticket.id
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-zinc-700 hover:border-zinc-600 bg-zinc-900"
              }`}
            >
              <div className="font-medium text-sm text-white">{ticket.subject}</div>
              <div className="text-xs text-zinc-400 mt-1">
                {ticket.user.email}
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                {new Date(ticket.createdAt).toLocaleDateString()}
              </div>
              <div className="flex gap-2 mt-2">
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    ticket.priority === "high"
                      ? "bg-red-900 text-red-200"
                      : ticket.priority === "normal"
                      ? "bg-yellow-900 text-yellow-200"
                      : "bg-blue-900 text-blue-200"
                  }`}
                >
                  {ticket.priority === "high" ? t.support.priorityHigh : ticket.priority === "normal" ? t.support.priorityNormal : t.support.priorityLow}
                </span>
                <span className="px-2 py-1 text-xs rounded bg-zinc-700 text-zinc-200">
                  {({NEW: t.support.statusNew, IN_PROGRESS: t.support.statusInProgress, RESOLVED: t.support.statusResolved, CLOSED: t.support.statusClosed} as Record<string, string>)[ticket.status] || ticket.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ticket Details */}
      <div className="flex-1">
        {selectedTicket ? (
          <div>
            <div className="mb-4 pb-4 border-b border-zinc-700">
              <h2 className="text-xl font-bold text-white">{selectedTicket.subject}</h2>
              <div className="text-sm text-zinc-400 mt-2">
                {t.support.from}: {selectedTicket.user.email}
              </div>
              <div className="text-sm text-zinc-400">
                {t.support.category}: {selectedTicket.category}
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2 text-zinc-300">{t.support.status}</label>
                <select
                    aria-label={t.support.ticketStatusLabel}
                  value={selectedTicket.status}
                  onChange={(e): void =>
                    void handleStatusChange(selectedTicket.id, e.target.value)
                  }
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="NEW">{t.support.statusNew}</option>
                  <option value="IN_PROGRESS">{t.support.statusInProgress}</option>
                  <option value="RESOLVED">{t.support.statusResolved}</option>
                  <option value="CLOSED">{t.support.statusClosed}</option>
                </select>
              </div>
            </div>

            {/* Original Message */}
            <div className="mb-6 p-4 bg-zinc-800 rounded">
              <div className="text-sm font-medium mb-2 text-zinc-300">
                {t.support.originalMessage}
              </div>
              <p className="text-sm text-zinc-200 whitespace-pre-wrap">
                {selectedTicket.message}
              </p>

              {/* Files */}
              {selectedTicket.files.length > 0 && (
                <div className="mt-4 border-t border-zinc-700 pt-4">
                  <div className="text-sm font-medium mb-2 text-zinc-300">
                    {t.support.attachments}
                  </div>
                  <div className="space-y-1">
                    {selectedTicket.files.map((file) => (
                      <a
                        key={file.id}
                        href={file.storagePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-emerald-400 hover:text-emerald-300 block"
                      >
                        📎 {file.originalName} ({(file.size / 1024).toFixed(1)} {t.support.kb})
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Replies */}
            <div className="mb-6 space-y-3 max-h-48 overflow-y-auto">
              {selectedTicket.replies.map((r) => (
                <div
                  key={r.id}
                  className={`p-3 rounded text-sm ${
                    r.user ? "bg-emerald-900 border border-emerald-700" : "bg-zinc-800 border border-zinc-700"
                  }`}
                >
                  <div className="font-medium text-xs mb-1 text-zinc-300">
                    {r.user ? r.user.email : t.support.admin}
                  </div>
                  <p className="text-zinc-100 whitespace-pre-wrap">{r.message}</p>
                  <div className="text-xs text-zinc-500 mt-1">
                    {new Date(r.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Form */}
            <form onSubmit={handleReply} className="border-t border-zinc-700 pt-4">
              <label className="block text-sm font-medium mb-2 text-zinc-300">
                {t.support.sendReply}
              </label>
              <textarea
                value={reply}
                onChange={(e): void => setReply(e.target.value)}
                placeholder={t.support.sendReply}
                rows={3}
                className="w-full mb-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={loading || !reply.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 text-white font-medium rounded transition"
              >
                {loading ? t.support.sending : t.support.send}
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center text-zinc-500">
            {t.support.selectTicket}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
