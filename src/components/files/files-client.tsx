"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Upload,
  FileText,
  Image,
  Film,
  Music,
  Archive,
  Trash2,
  Download,
  RefreshCw,
  HardDrive,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface FileItem {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.startsWith("video/")) return Film;
  if (mimeType.startsWith("audio/")) return Music;
  if (mimeType.includes("zip") || mimeType.includes("archive")) return Archive;
  return FileText;
}

export default function FilesClient() {
  const { t } = useI18n();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/files");
      const data = await res.json();
      setFiles(data.files || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/files", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t.files.uploadFailed);
        return;
      }

      await fetchFiles();
    } catch {
      setError(t.files.uploadFailedRetry);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
    if (res.ok) {
      setFiles((prev) => prev.filter((f) => f.id !== id));
    }
  };

  const handleDownload = (id: string, name: string) => {
    const a = document.createElement("a");
    a.href = `/api/files/${id}`;
    a.download = name;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 text-zinc-500 animate-spin" />
      </div>
    );
  }

  const totalSize = files.reduce((s, f) => s + f.size, 0);

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition ${
          dragActive
            ? "border-emerald-500 bg-emerald-950/20"
            : "border-zinc-700 hover:border-zinc-600 bg-zinc-900"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadFile(file);
            e.target.value = "";
          }}
        />
        {uploading ? (
          <div className="flex flex-col items-center">
            <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mb-3" />
            <p className="text-zinc-300 font-medium">{t.files.uploading}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-10 h-10 text-zinc-500 mb-3" />
            <p className="text-zinc-300 font-medium">
              {t.files.dropOrBrowse}
            </p>
            <p className="text-zinc-500 text-sm mt-1">
              {t.files.encryptionNote}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-950/30 border border-red-800 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-zinc-500">
        <div className="flex items-center gap-1.5">
          <HardDrive className="w-4 h-4" />
          <span>{t.files.filesCount.replace("{count}", String(files.length))} · {t.files.usedStorage.replace("{size}", formatBytes(totalSize))}</span>
        </div>
      </div>

      {/* File list */}
      {files.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
          <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-zinc-300 mb-2">{t.files.emptyTitle}</h2>
          <p className="text-zinc-500">
            {t.files.emptyDesc}
          </p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl divide-y divide-zinc-800">
          {files.map((file) => {
            const Icon = getFileIcon(file.mimeType);
            return (
              <div
                key={file.id}
                className="flex items-center gap-4 px-5 py-4 group hover:bg-zinc-800/50 transition"
              >
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {file.originalName}
                  </p>
                  <p className="text-zinc-500 text-xs">
                    {formatBytes(file.size)} ·{" "}
                    {new Date(file.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleDownload(file.id, file.originalName)}
                    className="p-2 rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-zinc-700 transition"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-700 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
