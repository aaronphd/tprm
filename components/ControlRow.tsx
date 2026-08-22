"use client";

import { useState, useTransition } from "react";
import type { ResponseStatus } from "@prisma/client";
import { saveResponse } from "@/lib/actions/responses";
import { MATURITY_LEVELS } from "@/lib/scoring";

interface Props {
  assessmentId: string;
  control: { id: string; code: string; title: string; description: string };
  initialMaturity: number | null;
  initialStatus: ResponseStatus;
  initialNotes: string | null;
}

export function ControlRow({ assessmentId, control, initialMaturity, initialStatus, initialNotes }: Props) {
  const [maturity, setMaturity] = useState(initialMaturity);
  const [status, setStatus] = useState<ResponseStatus>(initialStatus);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function persist(next: { maturity?: number | null; status?: ResponseStatus; notes?: string }) {
    const nextMaturity = next.maturity !== undefined ? next.maturity : maturity;
    const nextStatus = next.status !== undefined ? next.status : status;
    const nextNotes = next.notes !== undefined ? next.notes : notes;
    setSaved(false);
    startTransition(async () => {
      await saveResponse({
        assessmentId,
        controlId: control.id,
        maturity: nextStatus === "NOT_APPLICABLE" ? null : nextMaturity,
        status: nextStatus,
        notes: nextNotes.trim() || null,
      });
      setSaved(true);
    });
  }

  const isNotApplicable = status === "NOT_APPLICABLE";

  return (
    <div id={`control-${control.id}`} className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-900">
            <span className="text-slate-400">{control.code}</span> {control.title}
          </p>
          <p className="mt-1 text-sm text-slate-500">{control.description}</p>
        </div>
        <select
          value={status}
          onChange={(e) => {
            const value = e.target.value as ResponseStatus;
            setStatus(value);
            persist({ status: value });
          }}
          className="shrink-0 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
        >
          <option value="NOT_IMPLEMENTED">Not Implemented</option>
          <option value="PARTIAL">Partial</option>
          <option value="IMPLEMENTED">Implemented</option>
          <option value="NOT_APPLICABLE">Not Applicable</option>
        </select>
      </div>

      {!isNotApplicable && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {MATURITY_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => {
                setMaturity(level.value);
                persist({ maturity: level.value });
              }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                maturity === level.value
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {level.value} · {level.label}
            </button>
          ))}
        </div>
      )}

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => persist({})}
        placeholder="Notes / evidence (optional)"
        rows={1}
        className="mt-3 w-full resize-y rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />

      <div className="mt-1 h-4 text-right text-xs text-slate-400">
        {isPending ? "Saving…" : saved ? "Saved" : ""}
      </div>
    </div>
  );
}
