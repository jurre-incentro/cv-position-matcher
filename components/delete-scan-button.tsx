"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

export function DeleteScanButton({ scanId, label }: { scanId: string; label: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (isDeleting) {
      return;
    }

    const confirmed = window.confirm(`Scan "${label}" verwijderen? Dit kan niet ongedaan worden gemaakt.`);

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/scans/${scanId}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Scan verwijderen is mislukt");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan verwijderen is mislukt");
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {error ? <span className="hidden text-xs text-red-700 md:inline">{error}</span> : null}
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        aria-label={`Verwijder scan ${label}`}
        title={error ?? `Verwijder scan ${label}`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
