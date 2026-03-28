"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { useI18n } from "@/lib/i18n";

interface SupportFormData {
  subject: string;
  category: string;
  message: string;
  priority: string;
}

export function SupportClient() {
  const { t } = useI18n();
  const [formData, setFormData] = useState<SupportFormData>({
    subject: "",
    category: "general",
    message: "",
    priority: "normal",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create ticket
      const ticketResponse = await fetch("/api/support/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!ticketResponse.ok) {
        throw new Error("Failed to create ticket");
      }

      const ticket = await ticketResponse.json();

      // Upload files if any
      if (files.length > 0) {
        for (const file of files) {
          const fileFormData = new FormData();
          fileFormData.append("file", file);

          const fileResponse = await fetch(
            `/api/support/tickets/${ticket.id}/files`,
            {
              method: "POST",
              body: fileFormData,
            }
          );

          if (!fileResponse.ok) {
            console.error("Failed to upload file:", file.name);
          }
        }
      }

      setSuccess(true);
      setFormData({ subject: "", category: "general", message: "", priority: "normal" });
      setFiles([]);

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-white">{t.support.title}</h1>
      <p className="text-zinc-400 mb-6">{t.support.description}</p>

      {success && (
        <div className="mb-4 p-4 bg-green-900 border border-green-700 text-green-200 rounded">
          {t.support.success}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-900 border border-red-700 text-red-200 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium mb-1 text-zinc-300">
            {t.support.subject}
          </label>
          <input
            id="subject"
            type="text"
            value={formData.subject}
            onChange={(e) =>
              setFormData({ ...formData, subject: e.target.value })
            }
            placeholder={t.support.subjectPlaceholder}
            required
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-1 text-zinc-300">
            {t.support.category}
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e): void =>
              setFormData({ ...formData, category: e.target.value })
            }
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="general">{t.support.categoryGeneral}</option>
            <option value="technical">{t.support.categoryTechnical}</option>
            <option value="billing">{t.support.categoryBilling}</option>
            <option value="account">{t.support.categoryAccount}</option>
            <option value="security">{t.support.categorySecurity}</option>
          </select>
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium mb-1 text-zinc-300">
            {t.support.priority}
          </label>
          <select
            id="priority"
            value={formData.priority}
            onChange={(e): void =>
              setFormData({ ...formData, priority: e.target.value })
            }
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="low">{t.support.priorityLow}</option>
            <option value="normal">{t.support.priorityNormal}</option>
            <option value="high">{t.support.priorityHigh}</option>
          </select>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1 text-zinc-300">
            {t.support.message}
          </label>
          <textarea
            id="message"
            value={formData.message}
            onChange={(e): void =>
              setFormData({ ...formData, message: e.target.value })
            }
            placeholder={t.support.messagePlaceholder}
            rows={6}
            required
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label htmlFor="files" className="block text-sm font-medium mb-1 text-zinc-300">
            {t.support.attachments}
          </label>
          <input
            id="files"
            type="file"
            multiple
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx,.txt"
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white focus:outline-none focus:border-emerald-500 file:mr-2 file:bg-zinc-700 file:text-white file:border-0 file:rounded file:cursor-pointer"
          />
          {files.length > 0 && (
            <div className="mt-2 text-sm text-zinc-400">
              {typeof t.support.filesSelected === 'string'
                ? t.support.filesSelected.replace('{count}', String(files.length))
                : `${files.length} file(s) selected`}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-700 text-white font-medium rounded transition"
        >
          {loading ? t.common.loading : t.support.submit}
        </button>
      </form>
    </div>
  );
}
