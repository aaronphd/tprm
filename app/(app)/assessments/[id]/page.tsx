import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { scoreAssessment } from "@/lib/scoring";
import type { MaturityModel } from "@/lib/scoring";
import { completeAssessment } from "@/lib/actions/assessments";
import { ControlRow } from "@/components/ControlRow";
import { StatusBadge } from "@/components/StatusBadge";

export default async function AssessmentWorkspacePage({
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
      responses: { include: { evidence: true } },
    },
  });

  if (!assessment) notFound();

  const maturityModel = assessment.framework.maturityModel as unknown as MaturityModel;
  const score = scoreAssessment(assessment.framework.domains, assessment.responses, assessment.targetMaturity, maturityModel);
  const progressPct = score.totalControls > 0 ? Math.round((score.answeredControls / score.totalControls) * 100) : 0;
  const responseByControl = new Map(assessment.responses.map((r) => [r.controlId, r]));
  const completeAssessmentWithId = completeAssessment.bind(null, assessment.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            <Link href={`/organizations/${assessment.organizationId}`} className="hover:text-indigo-600">
              {assessment.organization.name}
            </Link>{" "}
            / {assessment.framework.name}
          </p>
          <h1 className="text-xl font-semibold text-slate-900">{assessment.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={assessment.status} />
          <Link
            href={`/assessments/${assessment.id}/results`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            View results
          </Link>
          {assessment.status !== "COMPLETED" && (
            <form action={completeAssessmentWithId}>
              <button
                type="submit"
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Mark complete
              </button>
            </form>
          )}
        </div>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>
            {score.answeredControls} of {score.totalControls} controls answered
          </span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-indigo-600" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="flex gap-8">
        <nav className="sticky top-20 hidden w-56 shrink-0 self-start space-y-1 text-sm md:block">
          {assessment.framework.domains.map((d) => (
            <a
              key={d.id}
              href={`#domain-${d.id}`}
              className="block truncate rounded px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              {d.code} {d.title}
            </a>
          ))}
        </nav>

        <div className="min-w-0 flex-1 space-y-10">
          {assessment.framework.domains.map((domain) => (
            <section key={domain.id} id={`domain-${domain.id}`}>
              <h2 className="mb-3 text-base font-semibold text-slate-900">
                {domain.code} &middot; {domain.title}
              </h2>
              <div className="space-y-3">
                {domain.controls.map((control) => {
                  const response = responseByControl.get(control.id);
                  return (
                    <ControlRow
                      key={control.id}
                      assessmentId={assessment.id}
                      control={control}
                      maturityLevels={maturityModel.levels}
                      initialMaturity={response?.maturity ?? null}
                      initialStatus={response?.status ?? "NOT_IMPLEMENTED"}
                      initialNotes={response?.notes ?? null}
                      initialEvidence={response?.evidence ?? []}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
