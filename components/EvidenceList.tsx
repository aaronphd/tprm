"use client";

import { useState, useTransition } from "react";
import { addEvidence, deleteEvidence } from "@/lib/actions/evidence";

export interface EvidenceItem {
  id: string;
  title: string;
  url: string;
  note: string | null;
}

interface Props {
  assessmentId: string;
  controlId: string;
  initialEvidence: EvidenceItem[];
}

export function EvidenceList({ assessmentId, controlId, initialEvidence }: Props) {
  const [items, setItems] = useState(initialEvidence);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const created = await addEvidence({ assessmentId, controlId, title, url, note: note || null });
        setItems((prev) => [...prev, created]);
        setTitle("");
        setUrl("");
        setNote("");
        setShowForm(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add evidence");
      }
    });
  }

  function handleDelete(id: string) {
    setError(null);
    startTransition(async () => {
      await deleteEvidence(id, assessmentId);
      setItems((prev) => prev.filter((item) => item.id !== id));
    });
  }

  return (
    <div className="mt-3">
      {items.length > 0 && (
        <ul className="mb-2 space-y-1">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-2 text-sm">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 truncate text-indigo-600 hover:text-indigo-500"
                title={item.note ?? undefined}
              >
                {item.title}
              </a>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                disabled={isPending}
                className="shrink-0 text-xs text-slate-400 hover:text-red-600 disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {showForm ? (
        <form onSubmit={handleAdd} className="space-y-1.5 rounded-md border border-slate-200 bg-slate-50 p-2.5">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Evidence title (e.g. Access review Q3 2026)"
            required
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
          />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            required
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
          />
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
              className="rounded px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
        >
          + Add evidence link
        </button>
      )}
    </div>
  );
}
