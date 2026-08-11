import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { label, FINDING_SEVERITIES, FINDING_STATUSES } from "@/lib/types";
import { FINDING_STATUS_BADGE, TIER_BADGE, TIER_ORDER } from "@/lib/risk";
import { formatDate, isOverdue } from "@/lib/format";
import { Badge, buttonPrimary, Card, EmptyState, PageHeader } from "@/components/ui";

export default async function FindingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; severity?: string }>;
}) {
  const { status, severity } = await searchParams;

  const findings = await prisma.finding.findMany({
    where: {
      AND: [status ? { status } : {}, severity ? { severity } : {}],
    },
    include: { vendor: true },
    orderBy: [{ createdAt: "desc" }],
  });

  findings.sort((a, b) => {
    const openRank = (s: string) => (s === "OPEN" || s === "IN_PROGRESS" ? 0 : 1);
    if (openRank(a.status) !== openRank(b.status)) return openRank(a.status) - openRank(b.status);
    return TIER_ORDER[a.severity] - TIER_ORDER[b.severity];
  });

  const openCount = findings.filter((f) => f.status === "OPEN" || f.status === "IN_PROGRESS").length;
  const overdueCount = findings.filter(
    (f) => (f.status === "OPEN" || f.status === "IN_PROGRESS") && isOverdue(f.dueDate)
  ).length;

  return (
    <div>
      <PageHeader
        title="Findings"
        description={`${openCount} open · ${overdueCount} overdue`}
        action={
          <Link href="/findings/new" className={buttonPrimary}>
            New finding
          </Link>
        }
      />

      <Card className="mb-4 p-4">
        <form className="flex flex-wrap items-end gap-3" method="get">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
            <select
              name="status"
              defaultValue={status ?? ""}
              className="block rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="">All</option>
              {FINDING_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Severity</label>
            <select
              name="severity"
              defaultValue={severity ?? ""}
              className="block rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="">All</option>
              {FINDING_SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="rounded-md border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            Filter
          </button>
          {(status || severity) && (
            <Link href="/findings" className="text-sm text-slate-500 underline underline-offset-2">
              Clear
            </Link>
          )}
        </form>
      </Card>

      {findings.length === 0 ? (
        <EmptyState
          title="No findings"
          description="Nothing tracked yet. Log a gap manually or generate one from an assessment."
          action={
            <Link href="/findings/new" className={buttonPrimary}>
              New finding
            </Link>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Finding</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Vendor</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Severity</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Owner</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {findings.map((f) => {
                const overdue = (f.status === "OPEN" || f.status === "IN_PROGRESS") && isOverdue(f.dueDate);
                return (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm">
                      <Link href={`/findings/${f.id}`} className="font-medium text-slate-900 hover:underline">
                        {f.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Link href={`/vendors/${f.vendorId}`} className="text-slate-600 hover:underline">
                        {f.vendor.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge className={TIER_BADGE[f.severity]}>{label(f.severity)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge className={FINDING_STATUS_BADGE[f.status]}>{label(f.status)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{f.owner ?? "—"}</td>
                    <td className={`px-4 py-3 text-sm ${overdue ? "font-medium text-red-600" : "text-slate-600"}`}>
                      {formatDate(f.dueDate)}
                      {overdue ? " (overdue)" : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
