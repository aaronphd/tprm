import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { scoreAssessment, maturityLabel } from "@/lib/scoring";
import type { MaturityModel } from "@/lib/scoring";
import { reopenAssessment } from "@/lib/actions/assessments";
import { StatusBadge } from "@/components/StatusBadge";
import { ReadinessBandBadge } from "@/components/ReadinessBandBadge";
import { DomainScoreBars } from "@/components/DomainScoreBars";
import { GapTable } from "@/components/GapTable";

export default async function AssessmentResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      organization: true,
      framework: {
        include: {
          domains: {
            orderBy: { sortOrder: "asc" },
            include: { controls: { orderBy: { sortOrder: "asc" } } },
          },
        },
      },
      responses: true,
    },
  });

  if (!assessment) notFound();

  const maturityModel = assessment.framework.maturityModel as unknown as MaturityModel;
  const score = scoreAssessment(assessment.framework.domains, assessment.responses, assessment.targetMaturity, maturityModel);
  const reopenAssessmentWithId = reopenAssessment.bind(null, assessment.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            <Link href={`/organizations/${assessment.organizationId}`} className="hover:text-indigo-600">
              {assessment.organization.name}
            </Link>{" "}
            / {assessment.framework.name}
          </p>
          <h1 className="text-xl font-semibold text-slate-900">{assessment.name} &mdash; Results</h1>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={assessment.status} />
          <a
            href={`/api/assessments/${assessment.id}/export`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Export CSV
          </a>
          <Link
            href={`/assessments/${assessment.id}`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to workspace
          </Link>
          {assessment.status === "COMPLETED" && (
            <form action={reopenAssessmentWithId}>
              <button
                type="submit"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Reopen
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 rounded-lg border border-slate-200 bg-white p-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <div>
          <p className="text-sm text-slate-500">Overall readiness</p>
          <p className="text-[48px] font-semibold leading-none text-slate-900">
            {score.overallPercentage != null ? `${Math.round(score.overallPercentage)}%` : "—"}
          </p>
          <div className="mt-3">
            {score.readinessBand ? (
              <ReadinessBandBadge band={score.readinessBand} />
            ) : (
              <span className="text-sm text-slate-400">Not enough data yet</span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Controls" value={score.totalControls} />
          <Stat label="Applicable" value={score.applicableControls} />
          <Stat label="Answered" value={score.answeredControls} />
          <Stat
            label="Target maturity"
            value={`${assessment.targetMaturity} · ${maturityLabel(assessment.targetMaturity, maturityModel.levels)}`}
          />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Readiness by domain <span className="font-normal text-slate-400">&middot; {maturityModel.name}</span>
        </h2>
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <DomainScoreBars domains={score.domains} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Gaps below target ({score.gaps.length})
        </h2>
        <GapTable gaps={score.gaps} targetMaturity={assessment.targetMaturity} maturityLevels={maturityModel.levels} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}
