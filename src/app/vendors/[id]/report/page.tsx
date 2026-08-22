import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DATA_CATEGORY_LABELS, label, parseDataCategories } from "@/lib/types";
import {
  ASSESSMENT_STATUS_BADGE,
  FINDING_STATUS_BADGE,
  TIER_BADGE,
  VENDOR_STATUS_BADGE,
  scoreColor,
} from "@/lib/risk";
import { computeUnifiedRisk } from "@/lib/unifiedRisk";
import type { OsintResult } from "@/lib/osint/types";
import { formatDate } from "@/lib/format";
import { Badge, buttonPrimary, buttonSecondary } from "@/components/ui";
import { PrintButton } from "@/components/PrintButton";

function ReportRow({ rowLabel, value }: { rowLabel: string; value: string }) {
  return (
    <tr>
      <td className="w-40 py-1 pr-4 align-top text-slate-500">{rowLabel}</td>
      <td className="py-1 text-slate-900">{value}</td>
    </tr>
  );
}

export default async function VendorReportPage({
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
      osintScans: { orderBy: { createdAt: "desc" }, take: 1 },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!vendor) notFound();

  const completedScores = vendor.assessments
    .filter((a) => a.status === "COMPLETED" && a.score !== null)
    .map((a) => a.score as number);

  const latestScan = vendor.osintScans[0] ?? null;
  const latestOsintResult: OsintResult | null = latestScan
    ? (JSON.parse(latestScan.resultJson) as OsintResult)
    : null;

  const dataCategories = parseDataCategories(vendor.dataCategories);
  const risk = computeUnifiedRisk({ dataCategories, completedScores, latestOsintResult });
  const openFindings = vendor.findings.filter((f) => f.status === "OPEN" || f.status === "IN_PROGRESS");

  return (
    <div className="mx-auto max-w-3xl print:max-w-none">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href={`/vendors/${id}`} className={buttonSecondary}>
          ← Back to vendor
        </Link>
        <PrintButton className={buttonPrimary} />
      </div>

      <header className="mb-8 border-b border-slate-200 pb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Vendor Risk Report</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{vendor.name}</h1>
        <p className="mt-1 text-sm text-slate-500">Generated {formatDate(new Date())}</p>
      </header>

      <section className="mb-8 break-inside-avoid">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Overview</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-slate-500">Risk tier</dt>
            <dd className="mt-0.5">
              <Badge className={TIER_BADGE[vendor.riskTier]}>{label(vendor.riskTier)}</Badge>
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Status</dt>
            <dd className="mt-0.5">
              <Badge className={VENDOR_STATUS_BADGE[vendor.status]}>{label(vendor.status)}</Badge>
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Category</dt>
            <dd className="text-slate-900">{vendor.category ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Internal owner</dt>
            <dd className="text-slate-900">{vendor.ownerName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Vendor contact</dt>
            <dd className="text-slate-900">
              {vendor.contactName ?? "—"}
              {vendor.contactEmail ? ` (${vendor.contactEmail})` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Contract</dt>
            <dd className="text-slate-900">
              {formatDate(vendor.contractStart)} – {formatDate(vendor.contractEnd)}
            </dd>
          </div>
        </dl>
        {vendor.description ? <p className="mt-3 text-sm text-slate-600">{vendor.description}</p> : null}
      </section>

      <section className="mb-8 break-inside-avoid">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Unified Risk Score</h2>
        <div className="flex flex-wrap items-center gap-6 rounded-lg border border-slate-200 p-4">
          <div>
            <p className="text-2xl font-bold text-slate-900">{risk.inherent}</p>
            <p className="text-xs text-slate-500">Inherent</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{risk.control ?? "—"}</p>
            <p className="text-xs text-slate-500">Control</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{risk.residual}</p>
            <p className="text-xs text-slate-500">Residual</p>
          </div>
          <Badge className={TIER_BADGE[risk.tier]}>{label(risk.tier)}</Badge>
        </div>
        {dataCategories.length > 0 ? (
          <p className="mt-2 text-xs text-slate-500">
            Data handled: {dataCategories.map((c) => DATA_CATEGORY_LABELS[c]).join(", ")}
          </p>
        ) : null}
        {risk.signalReasons.length > 0 ? (
          <>
            <p className="mt-3 text-xs font-medium text-slate-500">Residual signal boosts:</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-slate-600">
              {risk.signalReasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </>
        ) : null}
      </section>

      <section className="mb-8 break-inside-avoid">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">OSINT Snapshot</h2>
        {!latestScan || !latestOsintResult ? (
          <p className="text-sm text-slate-500">No OSINT scan on file for this vendor.</p>
        ) : (
          <>
            <p className="mb-2 text-xs text-slate-500">
              Domain: {latestOsintResult.domain} · Scanned {formatDate(latestScan.createdAt)}
            </p>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                <ReportRow
                  rowLabel="SPF"
                  value={latestOsintResult.spf.present ? (latestOsintResult.spf.policy ?? "Present") : "Missing"}
                />
                <ReportRow
                  rowLabel="DMARC"
                  value={latestOsintResult.dmarc.present ? `p=${latestOsintResult.dmarc.policy}` : "Missing"}
                />
                <ReportRow
                  rowLabel="DKIM"
                  value={
                    latestOsintResult.dkim.present
                      ? `${latestOsintResult.dkim.selectorsFound.length} selector(s) found`
                      : "None found"
                  }
                />
                <ReportRow
                  rowLabel="DNSSEC"
                  value={latestOsintResult.dnssec.validating ? "Validating" : "Not validating"}
                />
                <ReportRow
                  rowLabel="HSTS / CSP"
                  value={`${latestOsintResult.headers.hsts ? "HSTS set" : "No HSTS"}, ${
                    latestOsintResult.headers.csp ? "CSP set" : "No CSP"
                  }`}
                />
                <ReportRow
                  rowLabel="TLS certificate"
                  value={
                    latestOsintResult.tls.fetched
                      ? latestOsintResult.tls.daysUntilExpiry !== null
                        ? `Expires in ${latestOsintResult.tls.daysUntilExpiry} day(s)${latestOsintResult.tls.selfSigned ? " (self-signed)" : ""}`
                        : "Unknown expiry"
                      : "Lookup failed"
                  }
                />
                <ReportRow
                  rowLabel="DNS blacklist"
                  value={
                    latestOsintResult.blacklist.fetched
                      ? latestOsintResult.blacklist.checked.some((c) => c.listedOn.length > 0)
                        ? "Listed"
                        : "Not listed"
                      : "Not checked"
                  }
                />
                <ReportRow
                  rowLabel="Domain age"
                  value={
                    latestOsintResult.rdap.fetched && latestOsintResult.rdap.ageDays !== null
                      ? `${latestOsintResult.rdap.ageDays} days`
                      : "Unknown"
                  }
                />
                <ReportRow
                  rowLabel="security.txt"
                  value={latestOsintResult.securityTxt.present ? "Found" : "Not found"}
                />
                <ReportRow
                  rowLabel="Subdomains (crt.sh)"
                  value={
                    latestOsintResult.crt.fetched ? `${latestOsintResult.crt.subdomainCount ?? 0}` : "Not checked"
                  }
                />
                <ReportRow
                  rowLabel="Shodan InternetDB"
                  value={
                    latestOsintResult.shodan.fetched
                      ? `${latestOsintResult.shodan.vulns.length} CVE(s), ${latestOsintResult.shodan.ports.length} open port(s)`
                      : "Not checked"
                  }
                />
                <ReportRow
                  rowLabel="urlscan.io"
                  value={
                    latestOsintResult.urlscan.fetched
                      ? latestOsintResult.urlscan.malicious === true
                        ? "Flagged malicious"
                        : "Not flagged"
                      : "Not checked"
                  }
                />
              </tbody>
            </table>
            {latestScan.manualNotes ? (
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
                <span className="font-medium">Manual check notes:</span> {latestScan.manualNotes}
              </p>
            ) : null}
          </>
        )}
      </section>

      <section className="mb-8 break-inside-avoid">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Assessment history</h2>
        {vendor.assessments.length === 0 ? (
          <p className="text-sm text-slate-500">No assessments on file.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                <th className="py-1.5 pr-2">Title</th>
                <th className="py-1.5 pr-2">Template</th>
                <th className="py-1.5 pr-2">Status</th>
                <th className="py-1.5 pr-2">Score</th>
                <th className="py-1.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vendor.assessments.map((a) => (
                <tr key={a.id}>
                  <td className="py-1.5 pr-2 text-slate-900">{a.title}</td>
                  <td className="py-1.5 pr-2 text-slate-600">{a.template.name}</td>
                  <td className="py-1.5 pr-2">
                    <Badge className={ASSESSMENT_STATUS_BADGE[a.status]}>{label(a.status)}</Badge>
                  </td>
                  <td className={`py-1.5 pr-2 font-semibold ${a.score !== null ? scoreColor(a.score) : "text-slate-400"}`}>
                    {a.score ?? "—"}
                  </td>
                  <td className="py-1.5 text-slate-600">{formatDate(a.completedAt ?? a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="mb-8 break-inside-avoid">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Documents &amp; evidence
        </h2>
        {vendor.documents.length === 0 ? (
          <p className="text-sm text-slate-500">No documents linked.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {vendor.documents.map((d) => (
              <li key={d.id}>
                <span className="font-medium text-slate-900">{d.title}</span>
                <span className="text-slate-500"> — {d.url}</span>
                {d.notes ? <span className="text-slate-500"> ({d.notes})</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="break-inside-avoid">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Findings{openFindings.length > 0 ? ` (${openFindings.length} open)` : ""}
        </h2>
        {vendor.findings.length === 0 ? (
          <p className="text-sm text-slate-500">No findings on file.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                <th className="py-1.5 pr-2">Title</th>
                <th className="py-1.5 pr-2">Severity</th>
                <th className="py-1.5 pr-2">Status</th>
                <th className="py-1.5 pr-2">Owner</th>
                <th className="py-1.5">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vendor.findings.map((f) => (
                <tr key={f.id}>
                  <td className="py-1.5 pr-2 text-slate-900">{f.title}</td>
                  <td className="py-1.5 pr-2">
                    <Badge className={TIER_BADGE[f.severity]}>{label(f.severity)}</Badge>
                  </td>
                  <td className="py-1.5 pr-2">
                    <Badge className={FINDING_STATUS_BADGE[f.status]}>{label(f.status)}</Badge>
                  </td>
                  <td className="py-1.5 pr-2 text-slate-600">{f.owner ?? "—"}</td>
                  <td className="py-1.5 text-slate-600">{formatDate(f.dueDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
