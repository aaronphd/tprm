import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { label, parseDataCategories, RISK_TIERS, FINDING_SEVERITIES } from "@/lib/types";
import { FINDING_STATUS_BADGE, TIER_BADGE, scoreColor } from "@/lib/risk";
import { computeUnifiedRisk } from "@/lib/unifiedRisk";
import type { OsintResult } from "@/lib/osint/types";
import { formatDate } from "@/lib/format";
import { Badge, Card, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { TierPieChart } from "@/components/charts/TierPieChart";
import { SeverityBarChart } from "@/components/charts/SeverityBarChart";

export default async function DashboardPage() {
  const [
    totalVendors,
    vendorsByTierRaw,
    openFindingsBySeverityRaw,
    openFindingsCount,
    overdueFindings,
    assessmentsInProgress,
    completedAssessments,
    upcomingAssessments,
    vendorsForRisk,
  ] = await Promise.all([
    prisma.vendor.count(),
    prisma.vendor.groupBy({ by: ["riskTier"], _count: true }),
    prisma.finding.groupBy({
      by: ["severity"],
      _count: true,
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
    }),
    prisma.finding.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.finding.findMany({
      where: {
        status: { in: ["OPEN", "IN_PROGRESS"] },
        dueDate: { lt: new Date() },
      },
      include: { vendor: true },
      orderBy: { dueDate: "asc" },
      take: 6,
    }),
    prisma.assessment.count({ where: { status: { in: ["SENT", "IN_PROGRESS"] } } }),
    prisma.assessment.findMany({
      where: { status: "COMPLETED", score: { not: null } },
      select: { score: true },
    }),
    prisma.assessment.findMany({
      where: { status: { in: ["SENT", "IN_PROGRESS"] } },
      include: { vendor: true },
      orderBy: { dueAt: "asc" },
      take: 6,
    }),
    prisma.vendor.findMany({
      select: {
        id: true,
        name: true,
        dataCategories: true,
        assessments: {
          where: { status: "COMPLETED", score: { not: null } },
          select: { score: true },
        },
        osintScans: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { resultJson: true },
        },
      },
    }),
  ]);

  const tierCounts = Object.fromEntries(vendorsByTierRaw.map((r) => [r.riskTier, r._count]));
  const tierData = RISK_TIERS.map((t) => ({ tier: t, count: tierCounts[t] ?? 0 }));
  const criticalHighCount = (tierCounts["CRITICAL"] ?? 0) + (tierCounts["HIGH"] ?? 0);

  const severityCounts = Object.fromEntries(openFindingsBySeverityRaw.map((r) => [r.severity, r._count]));
  const severityData = FINDING_SEVERITIES.map((s) => ({ severity: s, count: severityCounts[s] ?? 0 }));

  const avgScore =
    completedAssessments.length > 0
      ? Math.round(
          completedAssessments.reduce((sum, a) => sum + (a.score ?? 0), 0) / completedAssessments.length
        )
      : null;

  const topResidualVendors = vendorsForRisk
    .map((v) => {
      const dataCategories = parseDataCategories(v.dataCategories);
      const completedScores = v.assessments.map((a) => a.score as number);
      const latestOsintResult = v.osintScans[0]
        ? (JSON.parse(v.osintScans[0].resultJson) as OsintResult)
        : null;
      const risk = computeUnifiedRisk({ dataCategories, completedScores, latestOsintResult });
      return { id: v.id, name: v.name, ...risk };
    })
    .sort((a, b) => b.residual - a.residual)
    .slice(0, 10);

  const highestResidual = topResidualVendors[0] ?? null;

  return (
    <div>
      <PageHeader title="Dashboard" description="Third-party risk posture at a glance." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total vendors" value={totalVendors} href="/vendors" />
        <StatCard
          label="Critical / High tier"
          value={criticalHighCount}
          sub="vendors requiring closest oversight"
          href="/vendors?tier=CRITICAL"
        />
        <StatCard
          label="Open findings"
          value={openFindingsCount}
          sub={`${overdueFindings.length} overdue`}
          href="/findings"
        />
        <StatCard
          label="Assessments in flight"
          value={assessmentsInProgress}
          sub={avgScore !== null ? `Avg completed score: ${avgScore}` : "No completed assessments yet"}
          href="/assessments"
        />
        <StatCard
          label="Highest residual risk"
          value={highestResidual ? highestResidual.residual : "—"}
          sub={highestResidual ? highestResidual.name : "No vendors yet"}
          href={highestResidual ? `/vendors/${highestResidual.id}` : "/vendors"}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Vendors by risk tier</h2>
          <TierPieChart data={tierData} />
          <div className="mt-3 flex flex-wrap gap-2">
            {tierData.map((d) => (
              <Badge key={d.tier} className={TIER_BADGE[d.tier]}>
                {label(d.tier)}: {d.count}
              </Badge>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Open findings by severity</h2>
          <SeverityBarChart data={severityData} />
        </Card>
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Top vendors by residual risk</h2>
        {topResidualVendors.length === 0 ? (
          <EmptyState title="No vendors yet" description="Add a vendor to see it ranked here." />
        ) : (
          <Card className="overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-10 px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">#</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Vendor</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Residual</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Inherent</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Control</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Computed tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topResidualVendors.map((v, i) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-400">{i + 1}</td>
                    <td className="px-4 py-3 text-sm">
                      <Link href={`/vendors/${v.id}`} className="font-medium text-slate-900 hover:underline">
                        {v.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">{v.residual}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{v.inherent}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{v.control ?? "—"}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge className={TIER_BADGE[v.tier]}>{label(v.tier)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
        <p className="mt-2 text-xs text-slate-400">
          Computed from data sensitivity classification, assessment history, and the latest OSINT
          scan per vendor — see the Unified Risk Score on each vendor&apos;s page for the full
          breakdown. Separate from the manually-assigned risk tier shown elsewhere.
        </p>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Overdue findings</h2>
          {overdueFindings.length === 0 ? (
            <EmptyState title="Nothing overdue" description="All open findings are within their due date." />
          ) : (
            <Card className="divide-y divide-slate-100">
              {overdueFindings.map((f) => (
                <Link
                  key={f.id}
                  href={`/findings/${f.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{f.title}</p>
                    <p className="text-xs text-slate-500">{f.vendor.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-red-600">{formatDate(f.dueDate)}</span>
                    <Badge className={FINDING_STATUS_BADGE[f.status]}>{label(f.status)}</Badge>
                  </div>
                </Link>
              ))}
            </Card>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Assessments awaiting response</h2>
          {upcomingAssessments.length === 0 ? (
            <EmptyState title="Nothing in flight" description="No sent or in-progress assessments." />
          ) : (
            <Card className="divide-y divide-slate-100">
              {upcomingAssessments.map((a) => (
                <Link
                  key={a.id}
                  href={`/assessments/${a.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{a.title}</p>
                    <p className="text-xs text-slate-500">{a.vendor.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Due {formatDate(a.dueAt)}</p>
                    {a.score !== null && (
                      <p className={`text-xs font-semibold ${scoreColor(a.score)}`}>{a.score}</p>
                    )}
                  </div>
                </Link>
              ))}
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
