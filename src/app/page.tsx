import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { label, RISK_TIERS, FINDING_SEVERITIES } from "@/lib/types";
import { FINDING_STATUS_BADGE, TIER_BADGE, scoreColor } from "@/lib/risk";
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

  return (
    <div>
      <PageHeader title="Dashboard" description="Third-party risk posture at a glance." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
