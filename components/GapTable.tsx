import type { Gap } from "@/lib/scoring";
import { maturityLabel } from "@/lib/scoring";

export function GapTable({ gaps, targetMaturity }: { gaps: Gap[]; targetMaturity: number }) {
  if (gaps.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        No gaps below the target maturity ({targetMaturity} &middot; {maturityLabel(targetMaturity)}).
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-2 font-medium">Domain</th>
            <th className="px-4 py-2 font-medium">Control</th>
            <th className="px-4 py-2 font-medium">Current</th>
            <th className="px-4 py-2 font-medium">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {gaps.map((gap) => (
            <tr key={gap.control.id}>
              <td className="px-4 py-2.5 whitespace-nowrap text-slate-600">{gap.domainCode}</td>
              <td className="px-4 py-2.5">
                <p className="font-medium text-slate-900">
                  {gap.control.code} {gap.control.title}
                </p>
              </td>
              <td className="px-4 py-2.5 whitespace-nowrap text-slate-600">
                {maturityLabel(gap.control.maturity)}
              </td>
              <td className="px-4 py-2.5 text-slate-500">{gap.control.notes ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
