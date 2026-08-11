import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deleteFinding, updateFinding } from "@/lib/actions/findings";
import { label, FINDING_SEVERITIES, FINDING_STATUSES } from "@/lib/types";
import { formatDate } from "@/lib/format";
import {
  Card,
  PageHeader,
  buttonDanger,
  buttonPrimary,
  buttonSecondary,
  inputClass,
  labelClass,
} from "@/components/ui";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";

function toDateInput(d: Date | null) {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export default async function FindingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const finding = await prisma.finding.findUnique({
    where: { id },
    include: { vendor: true, assessment: true },
  });
  if (!finding) notFound();

  const saveAction = updateFinding.bind(null, id);
  const deleteActionBound = deleteFinding.bind(null, id);

  return (
    <div>
      <PageHeader
        title={finding.title}
        description={
          <>
            <Link href={`/vendors/${finding.vendorId}`} className="hover:underline">
              {finding.vendor.name}
            </Link>
            {finding.assessment ? (
              <>
                {" · from "}
                <Link href={`/assessments/${finding.assessment.id}`} className="hover:underline">
                  {finding.assessment.title}
                </Link>
              </>
            ) : null}
            {` · Opened ${formatDate(finding.createdAt)}`}
          </>
        }
        action={
          <form action={deleteActionBound}>
            <ConfirmSubmitButton confirmMessage="Delete this finding?" className={buttonDanger}>
              Delete
            </ConfirmSubmitButton>
          </form>
        }
      />

      <Card className="max-w-2xl p-6">
        <form action={saveAction} className="space-y-4">
          <div>
            <label className={labelClass}>Title *</label>
            <input type="text" name="title" required defaultValue={finding.title} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea name="description" rows={3} defaultValue={finding.description ?? ""} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Severity</label>
              <select name="severity" defaultValue={finding.severity} className={inputClass}>
                {FINDING_SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {label(s)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select name="status" defaultValue={finding.status} className={inputClass}>
                {FINDING_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {label(s)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Owner</label>
              <input type="text" name="owner" defaultValue={finding.owner ?? ""} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Due date</label>
              <input type="date" name="dueDate" defaultValue={toDateInput(finding.dueDate)} className={inputClass} />
            </div>
          </div>

          {finding.resolvedAt ? (
            <p className="text-xs text-slate-500">Resolved {formatDate(finding.resolvedAt)}</p>
          ) : null}

          <div className="flex gap-3 pt-2">
            <button type="submit" className={buttonPrimary}>
              Save changes
            </button>
            <Link href={`/vendors/${finding.vendorId}`} className={buttonSecondary}>
              Back to vendor
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
