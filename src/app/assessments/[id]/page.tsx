import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  deleteAssessment,
  generateFindingsFromRiskyResponses,
  markAssessmentSent,
  saveAssessmentResponses,
} from "@/lib/actions/assessments";
import { label } from "@/lib/types";
import { ANSWER_BADGE, ANSWER_OPTIONS, ASSESSMENT_STATUS_BADGE, scoreColor, scoreLabel } from "@/lib/risk";
import { formatDate } from "@/lib/format";
import {
  Badge,
  buttonDanger,
  buttonPrimary,
  buttonSecondary,
  Card,
  PageHeader,
} from "@/components/ui";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      vendor: true,
      template: true,
      responses: {
        include: { questionTemplate: true },
      },
    },
  });
  if (!assessment) notFound();

  const responses = [...assessment.responses].sort(
    (a, b) => a.questionTemplate.order - b.questionTemplate.order
  );

  const categories = Array.from(new Set(responses.map((r) => r.category)));
  const riskyCount = responses.filter((r) => r.riskFlag).length;

  const saveAction = saveAssessmentResponses.bind(null, id);
  const sentAction = markAssessmentSent.bind(null, id);
  const findingsAction = generateFindingsFromRiskyResponses.bind(null, id);
  const deleteActionBound = deleteAssessment.bind(null, id);

  return (
    <div>
      <PageHeader
        title={assessment.title}
        description={
          <>
            <Link href={`/vendors/${assessment.vendorId}`} className="hover:underline">
              {assessment.vendor.name}
            </Link>
            {" · "}
            {assessment.template.name}
          </>
        }
        action={
          <div className="flex items-center gap-2">
            {assessment.status === "DRAFT" && (
              <form action={sentAction}>
                <button type="submit" className={buttonSecondary}>
                  Mark as sent
                </button>
              </form>
            )}
            <form action={deleteActionBound}>
              <ConfirmSubmitButton
                confirmMessage="Delete this assessment and all of its responses?"
                className={buttonDanger}
              >
                Delete
              </ConfirmSubmitButton>
            </form>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-500">Status</p>
          <div className="mt-1.5">
            <Badge className={ASSESSMENT_STATUS_BADGE[assessment.status]}>{label(assessment.status)}</Badge>
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-500">Score</p>
          <p className={`mt-1 text-2xl font-semibold ${scoreColor(assessment.score)}`}>
            {assessment.score ?? "—"}
            {assessment.score !== null && <span className="ml-1 text-sm font-normal text-slate-400">/ 100</span>}
          </p>
          <p className="text-xs text-slate-500">{scoreLabel(assessment.score)}</p>
        </Card>
        <Card className="flex flex-col justify-between p-4">
          <div>
            <p className="text-xs font-medium text-slate-500">Risk-flagged answers</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{riskyCount}</p>
          </div>
          {riskyCount > 0 && (
            <form action={findingsAction} className="mt-2">
              <button type="submit" className="text-xs font-medium text-slate-700 underline underline-offset-2 hover:text-slate-900">
                Generate findings from flagged answers
              </button>
            </form>
          )}
        </Card>
      </div>

      <form action={saveAction} className="space-y-6">
        {categories.map((category) => (
          <Card key={category} className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">{category}</h2>
            <div className="space-y-5">
              {responses
                .filter((r) => r.category === category)
                .map((r) => (
                  <div key={r.id} className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm text-slate-800">{r.text}</p>
                      {r.riskFlag && (
                        <Badge className="shrink-0 bg-red-100 text-red-800 ring-red-600/20">Flagged</Badge>
                      )}
                    </div>
                    <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr]">
                      <select
                        name={`answer_${r.id}`}
                        defaultValue={r.answer}
                        className={`rounded-md border px-2.5 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 ${ANSWER_BADGE[r.answer] ?? ""} border-slate-300 focus:ring-slate-500`}
                      >
                        <option value="UNANSWERED">{label("UNANSWERED")}</option>
                        {ANSWER_OPTIONS.map((a) => (
                          <option key={a} value={a}>
                            {label(a)}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        name={`notes_${r.id}`}
                        defaultValue={r.notes ?? ""}
                        placeholder="Notes (optional)"
                        className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm shadow-sm placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        ))}

        <div className="flex gap-3">
          <button type="submit" name="_complete" value="0" className={buttonSecondary}>
            Save progress
          </button>
          <button type="submit" name="_complete" value="1" className={buttonPrimary}>
            Save &amp; mark complete
          </button>
        </div>
      </form>

      <p className="mt-4 text-xs text-slate-400">
        Created {formatDate(assessment.createdAt)}
        {assessment.sentAt ? ` · Sent ${formatDate(assessment.sentAt)}` : ""}
        {assessment.completedAt ? ` · Completed ${formatDate(assessment.completedAt)}` : ""}
      </p>
    </div>
  );
}
