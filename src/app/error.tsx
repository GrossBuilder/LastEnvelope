"use client";

import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <AlertTriangle className="w-16 h-16 text-red-500 mb-6" />
      <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
      <p className="text-zinc-400 mb-8 max-w-md">
        An unexpected error occurred. Please try again or contact support if the
        problem persists.
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition font-medium"
      >
        Try again
      </button>
    </div>
  );
}
