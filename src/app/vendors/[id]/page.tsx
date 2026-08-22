import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deleteVendor } from "@/lib/actions/vendors";
import { label } from "@/lib/types";
import {
  ASSESSMENT_STATUS_BADGE,
  FINDING_STATUS_BADGE,
  TIER_BADGE,
  VENDOR_STATUS_BADGE,
  scoreColor,
} from "@/lib/risk";
import { formatDate } from "@/lib/format";
import {
  Badge,
  buttonDanger,
  buttonPrimary,
  buttonSecondary,
  Card,
  EmptyState,
  PageHeader,
} from "@/components/ui";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { OsintPanel } from "@/components/OsintPanel";
import { UnifiedRiskCard } from "@/components/UnifiedRiskCard";
import type { OsintResult } from "@/lib/osint/types";

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: {
      assessments: { orderBy: { createdAt: "desc" }, include: { template: true } },
      findings: { orderBy: [{ status: "asc" }, { createdAt: "desc" }] },
      osintScans: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!vendor) notFound();

  const deleteAction = deleteVendor.bind(null, id);

  const completedScores = vendor.assessments
    .filter((a) => a.status === "COMPLETED" && a.score !== null)
    .map((a) => a.score as number);

  const latestOsintScan = vendor.osintScans[0];
  const latestOsintResult = latestOsintScan
    ? (JSON.parse(latestOsintScan.resultJson) as OsintResult)
    : null;

  return (
    <div>
      <PageHeader
        title={vendor.name}
        description={vendor.description ?? undefined}
        action={
          <div className="flex gap-2">
            <Link href={`/vendors/${id}/report`} className={buttonSecondary}>
              View report
            </Link>
            <Link href={`/vendors/${id}/edit`} className={buttonSecondary}>
              Edit
            </Link>
            <form action={deleteAction}>
              <ConfirmSubmitButton
                confirmMessage={`Delete ${vendor.name}? This removes its assessments and findings too.`}
                className={buttonDanger}
              >
                Delete
              </ConfirmSubmitButton>
            </form>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-slate-900">Overview</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Risk tier</dt>
                <dd>
                  <Badge className={TIER_BADGE[vendor.riskTier]}>{label(vendor.riskTier)}</Badge>
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Status</dt>
                <dd>
                  <Badge className={VENDOR_STATUS_BADGE[vendor.status]}>{label(vendor.status)}</Badge>
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Category</dt>
                <dd className="text-slate-900">{vendor.category ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Internal owner</dt>
                <dd className="text-slate-900">{vendor.ownerName ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Vendor contact</dt>
                <dd className="text-slate-900 text-right">
                  {vendor.contactName ?? "—"}
                  {vendor.contactEmail ? (
                    <div className="text-xs text-slate-500">{vendor.contactEmail}</div>
                  ) : null}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Contract</dt>
                <dd className="text-slate-900">
                  {formatDate(vendor.contractStart)} – {formatDate(vendor.contractEnd)}
                </dd>
              </div>
              {vendor.website ? (
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500">Website</dt>
                  <dd className="truncate text-slate-900">{vendor.website}</dd>
                </div>
              ) : null}
            </dl>
            {vendor.notes ? (
              <>
                <h3 className="mt-5 text-xs font-medium uppercase tracking-wide text-slate-500">Notes</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{vendor.notes}</p>
              </>
            ) : null}
          </Card>

          <UnifiedRiskCard
            dataCategoriesJson={vendor.dataCategories}
            completedScores={completedScores}
            latestOsintResult={latestOsintResult}
            latestOsintScannedAt={latestOsintScan?.createdAt ?? null}
          />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Assessments</h2>
              <Link href={`/assessments/new?vendorId=${id}`} className={buttonPrimary}>
                New assessment
              </Link>
            </div>
            {vendor.assessments.length === 0 ? (
              <EmptyState title="No assessments yet" description="Start a security questionnaire for this vendor." />
            ) : (
              <Card className="divide-y divide-slate-100">
                {vendor.assessments.map((a) => (
                  <Link
                    key={a.id}
                    href={`/assessments/${a.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{a.title}</p>
                      <p className="text-xs text-slate-500">
                        {a.template.name} · Created {formatDate(a.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {a.score !== null ? (
                        <span className={`text-sm font-semibold ${scoreColor(a.score)}`}>{a.score}</span>
                      ) : null}
                      <Badge className={ASSESSMENT_STATUS_BADGE[a.status]}>{label(a.status)}</Badge>
                    </div>
                  </Link>
                ))}
              </Card>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Findings</h2>
              <Link href={`/findings/new?vendorId=${id}`} className={buttonPrimary}>
                New finding
              </Link>
            </div>
            {vendor.findings.length === 0 ? (
              <EmptyState title="No findings" description="No open gaps recorded for this vendor." />
            ) : (
              <Card className="divide-y divide-slate-100">
                {vendor.findings.map((f) => (
                  <Link
                    key={f.id}
                    href={`/findings/${f.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{f.title}</p>
                      <p className="text-xs text-slate-500">
                        {f.owner ? `Owner: ${f.owner} · ` : ""}
                        Due {formatDate(f.dueDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={TIER_BADGE[f.severity]}>{label(f.severity)}</Badge>
                      <Badge className={FINDING_STATUS_BADGE[f.status]}>{label(f.status)}</Badge>
                    </div>
                  </Link>
                ))}
              </Card>
            )}
          </section>

          <OsintPanel vendorId={id} vendorWebsite={vendor.website} scans={vendor.osintScans} />
        </div>
      </div>
    </div>
  );
}
