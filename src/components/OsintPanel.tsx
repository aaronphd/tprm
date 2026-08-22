import type { OsintScan } from "@prisma/client";
import { runOsintScan, saveOsintNotes, deleteOsintScan } from "@/lib/actions/osint";
import { cleanDomain, externalCheckLinks } from "@/lib/osint/lookups";
import type { OsintResult } from "@/lib/osint/types";
import { formatDate } from "@/lib/format";
import { Card, EmptyState, buttonPrimary, buttonSecondary, inputClass, labelClass } from "@/components/ui";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";

function tileTone(ok: boolean | null, warn = false): string {
  if (warn) return "border-amber-200 bg-amber-50 text-amber-900";
  if (ok === true) return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (ok === false) return "border-red-200 bg-red-50 text-red-900";
  return "border-slate-200 bg-white text-slate-600";
}

function ScanTile({
  label,
  value,
  ok,
  warn,
  detail,
}: {
  label: string;
  value: string;
  ok: boolean | null;
  warn?: boolean;
  detail?: string;
}) {
  return (
    <div className={`rounded-md border p-2.5 ${tileTone(ok, warn)}`}>
      <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-0.5 font-mono text-xs leading-tight">{value}</div>
      {detail ? (
        <details className="mt-1 text-[10px] text-slate-500">
          <summary className="cursor-pointer hover:text-slate-700">detail</summary>
          <pre className="mt-1 whitespace-pre-wrap break-all font-mono">{detail}</pre>
        </details>
      ) : null}
    </div>
  );
}

function ScanResultGrid({ result }: { result: OsintResult }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <ScanTile
        label="SPF"
        ok={result.spf.present}
        value={result.spf.present ? (result.spf.policy ?? "present") : "Missing"}
        detail={result.spf.raw}
      />
      <ScanTile
        label="DMARC"
        ok={result.dmarc.present && result.dmarc.policy !== "none"}
        warn={result.dmarc.present && result.dmarc.policy === "none"}
        value={result.dmarc.present ? `p=${result.dmarc.policy} pct=${result.dmarc.pct}` : "Missing"}
        detail={result.dmarc.raw}
      />
      <ScanTile
        label="DKIM"
        ok={result.dkim.present}
        value={
          result.dkim.present
            ? `${result.dkim.selectorsFound.length} selector(s): ${result.dkim.selectorsFound.join(", ")}`
            : "None among common selectors"
        }
        detail={`Checked: ${result.dkim.selectorsChecked.join(", ")}`}
      />
      <ScanTile
        label="DNSSEC"
        ok={result.dnssec.validating}
        value={result.dnssec.validating ? "Validating (AD flag)" : "Not signed / not validating"}
        detail={`DS record at parent zone: ${result.dnssec.dsPresent ? "present" : "not found"}`}
      />
      <ScanTile
        label="HSTS"
        ok={result.headers.fetched ? Boolean(result.headers.hsts) : null}
        value={result.headers.fetched ? (result.headers.hsts ?? "Not set") : "Fetch failed"}
      />
      <ScanTile
        label="CSP"
        ok={result.headers.fetched ? Boolean(result.headers.csp) : null}
        value={result.headers.fetched ? (result.headers.csp ? "Present" : "Not set") : "Fetch failed"}
        detail={result.headers.csp ?? undefined}
      />
      <ScanTile
        label="MX records"
        ok={null}
        value={result.mx.length ? `${result.mx.length} mail exchanger(s)` : "None"}
        detail={result.mx.join("\n") || undefined}
      />
      <ScanTile
        label="Subdomains (crt.sh)"
        ok={null}
        warn={(result.crt.subdomainCount ?? 0) > 50}
        value={
          result.crt.fetched
            ? `${result.crt.subdomainCount}${result.crt.truncated ? "+" : ""} unique names`
            : "Lookup failed"
        }
        detail={result.crt.subdomains.slice(0, 40).join("\n") || undefined}
      />
      <ScanTile
        label="Other headers"
        ok={null}
        value={result.headers.fetched ? `HTTP ${result.headers.statusCode}` : "Fetch failed"}
        detail={
          result.headers.fetched
            ? [
                `X-Frame-Options: ${result.headers.xFrameOptions ?? "not set"}`,
                `X-Content-Type-Options: ${result.headers.xContentTypeOptions ?? "not set"}`,
                `Referrer-Policy: ${result.headers.referrerPolicy ?? "not set"}`,
              ].join("\n")
            : (result.headers.error ?? undefined)
        }
      />
      <ScanTile
        label="Shodan InternetDB"
        ok={result.shodan.fetched ? result.shodan.vulns.length === 0 : null}
        value={
          !result.shodan.fetched
            ? "Lookup failed"
            : result.shodan.vulns.length > 0
              ? `${result.shodan.vulns.length} known CVE(s), ${result.shodan.ports.length} open port(s)`
              : result.shodan.ports.length > 0
                ? `No known CVEs, ${result.shodan.ports.length} open port(s)`
                : "No data on file (not indexed by Shodan)"
        }
        detail={
          result.shodan.fetched
            ? [
                result.shodan.ip ? `IP: ${result.shodan.ip}` : null,
                result.shodan.ports.length ? `Ports: ${result.shodan.ports.join(", ")}` : null,
                result.shodan.vulns.length ? `CVEs: ${result.shodan.vulns.join(", ")}` : null,
                result.shodan.tags.length ? `Tags: ${result.shodan.tags.join(", ")}` : null,
              ]
                .filter(Boolean)
                .join("\n") || undefined
            : (result.shodan.error ?? undefined)
        }
      />
    </div>
  );
}

export function OsintPanel({
  vendorId,
  vendorWebsite,
  scans,
}: {
  vendorId: string;
  vendorWebsite: string | null;
  scans: OsintScan[];
}) {
  const defaultDomain = cleanDomain(vendorWebsite ?? "");
  const [latest, ...older] = scans;
  const latestResult = latest ? (JSON.parse(latest.resultJson) as OsintResult) : null;
  const linkDomain = cleanDomain(latest?.domain ?? defaultDomain);
  const links = externalCheckLinks(linkDomain);

  const scanAction = runOsintScan.bind(null, vendorId);
  const notesAction = latest ? saveOsintNotes.bind(null, latest.id) : null;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">OSINT Snapshot</h2>
      </div>

      <Card className="mb-4 p-5">
        <p className="mb-3 text-xs text-slate-500">
          Free, keyless lookups run against public DNS (Google DoH) and certificate transparency logs
          (crt.sh), plus the vendor&apos;s own HTTPS response headers. This is a snapshot at the moment
          you click Scan, not continuous monitoring — re-run it periodically.
        </p>
        <form action={scanAction} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label className={labelClass}>Domain</label>
            <input
              type="text"
              name="domain"
              required
              defaultValue={defaultDomain}
              placeholder="example.com"
              className={inputClass}
            />
          </div>
          <button type="submit" className={buttonPrimary}>
            Run scan
          </button>
        </form>
      </Card>

      {!latest ? (
        <EmptyState title="No scans yet" description="Run a scan above to pull SPF/DMARC/DKIM/DNSSEC, HTTPS headers, and subdomains." />
      ) : (
        <Card className="mb-4 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="font-mono text-sm text-slate-900">{latest.domain}</p>
              <p className="text-xs text-slate-500">Scanned {formatDate(latest.createdAt)}</p>
            </div>
            <form action={deleteOsintScan.bind(null, latest.id)}>
              <ConfirmSubmitButton confirmMessage="Delete this scan snapshot?" className="text-xs text-red-600 underline underline-offset-2 hover:text-red-800">
                Delete
              </ConfirmSubmitButton>
            </form>
          </div>

          {latestResult ? <ScanResultGrid result={latestResult} /> : null}

          {latestResult && latestResult.errors.length > 0 ? (
            <details className="mt-3 text-xs text-slate-500">
              <summary className="cursor-pointer hover:text-slate-700">Lookup errors ({latestResult.errors.length})</summary>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {latestResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </details>
          ) : null}

          {notesAction ? (
            <form action={notesAction} className="mt-4 border-t border-slate-100 pt-4">
              <label className={labelClass}>Manual check notes</label>
              <textarea
                name="manualNotes"
                rows={3}
                defaultValue={latest.manualNotes ?? ""}
                placeholder="Paste back grades/findings from the deep links below (e.g. SSL Labs: A, Security Headers: B, Shodan: 2 open services)…"
                className={inputClass}
              />
              <button type="submit" className={`${buttonSecondary} mt-2`}>
                Save notes
              </button>
            </form>
          ) : null}
        </Card>
      )}

      {older.length > 0 ? (
        <details className="mb-4 text-xs text-slate-500">
          <summary className="cursor-pointer hover:text-slate-700">Scan history ({older.length} older)</summary>
          <ul className="mt-2 space-y-1 pl-4">
            {older.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3">
                <span>
                  <span className="font-mono">{s.domain}</span> — {formatDate(s.createdAt)}
                </span>
                <form action={deleteOsintScan.bind(null, s.id)}>
                  <ConfirmSubmitButton confirmMessage="Delete this scan snapshot?" className="text-red-600 underline underline-offset-2 hover:text-red-800">
                    Delete
                  </ConfirmSubmitButton>
                </form>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <Card className="p-5">
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">Manual checks — one-click</h3>
          {linkDomain ? <span className="font-mono text-xs text-slate-400">{linkDomain}</span> : null}
        </div>
        {!linkDomain ? (
          <p className="text-sm text-slate-500">Set a domain above to enable one-click external checks.</p>
        ) : (
          <>
            <p className="mb-3 text-xs text-slate-500">
              Opens each service in a new tab with the domain pre-filled where the tool supports it.
              Paste findings into the notes above.
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {links.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start justify-between gap-2 rounded-md border border-slate-200 px-3 py-2 hover:border-slate-400 hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-900">{link.name}</div>
                    <div className="mt-0.5 text-[10px] text-slate-500">{link.purpose}</div>
                  </div>
                </a>
              ))}
            </div>
          </>
        )}
      </Card>
    </section>
  );
}
