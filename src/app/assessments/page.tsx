import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { label } from "@/lib/types";
import { ASSESSMENT_STATUS_BADGE, scoreColor } from "@/lib/risk";
import { formatDate } from "@/lib/format";
import { Badge, buttonPrimary, Card, EmptyState, PageHeader } from "@/components/ui";

export default async function AssessmentsPage() {
  const assessments = await prisma.assessment.findMany({
    orderBy: { createdAt: "desc" },
    include: { vendor: true, template: true },
  });

  return (
    <div>
      <PageHeader
        title="Assessments"
        description="Vendor security questionnaires in flight and completed."
        action={
          <Link href="/assessments/new" className={buttonPrimary}>
            New assessment
          </Link>
        }
      />

      {assessments.length === 0 ? (
        <EmptyState
          title="No assessments yet"
          description="Start a vendor security questionnaire from a vendor's page or here."
          action={
            <Link href="/assessments/new" className={buttonPrimary}>
              New assessment
            </Link>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Vendor</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Assessment</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Score</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assessments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm">
                    <Link href={`/vendors/${a.vendorId}`} className="text-slate-700 hover:underline">
                      {a.vendor.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Link href={`/assessments/${a.id}`} className="font-medium text-slate-900 hover:underline">
                      {a.title}
                    </Link>
                    <div className="text-xs text-slate-500">{a.template.name}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge className={ASSESSMENT_STATUS_BADGE[a.status]}>{label(a.status)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {a.score !== null ? (
                      <span className={`font-semibold ${scoreColor(a.score)}`}>{a.score}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{formatDate(a.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
