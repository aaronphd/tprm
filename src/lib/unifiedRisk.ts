import type { OsintResult } from "@/lib/osint/types";
import { DATA_CATEGORY_WEIGHTS, type DataCategory, type RiskTier } from "@/lib/types";

// Unified risk score: combines inherent risk (what kind of data the
// vendor touches), control effectiveness (how they scored on completed
// assessments), and residual risk signals pulled automatically from the
// latest OSINT scan. Deliberately excludes anything that would need
// manual upkeep (breach history, financial health, etc.) -- if that data
// isn't tracked, it can't silently go stale here.
//
// This is informational and separate from the vendor's manually-assigned
// riskTier; it doesn't overwrite it.

export type UnifiedRisk = {
  inherent: number;
  control: number | null;
  residual: number;
  tier: RiskTier;
  signalReasons: string[];
};

export function computeInherentRisk(dataCategories: DataCategory[]): number {
  const sum = dataCategories.reduce((s, c) => s + (DATA_CATEGORY_WEIGHTS[c] ?? 0), 0);
  return Math.min(100, sum);
}

export function computeControlScore(completedScores: number[]): number | null {
  if (completedScores.length === 0) return null;
  const avg = completedScores.reduce((s, v) => s + v, 0) / completedScores.length;
  return Math.round(avg);
}

const CVE_POINTS_PER_VULN = 5;
const CVE_POINTS_CAP = 20;
const SIGNAL_CAP = 60;
const WEAK_TLS_PROTOCOLS = ["TLSv1", "TLSv1.1"];
const NEW_DOMAIN_THRESHOLD_DAYS = 180;

export function computeResidualSignals(result: OsintResult | null): {
  total: number;
  reasons: string[];
} {
  if (!result) return { total: 0, reasons: [] };
  let total = 0;
  const reasons: string[] = [];

  if (!result.dmarc.present) {
    total += 8;
    reasons.push("No DMARC record (+8)");
  } else if (result.dmarc.policy === "none") {
    total += 5;
    reasons.push("DMARC policy is p=none (monitoring only, no enforcement) (+5)");
  }

  if (!result.spf.present) {
    total += 5;
    reasons.push("No SPF record (+5)");
  }

  if (!result.dkim.present) {
    total += 2;
    reasons.push("No DKIM selector found among common ones checked (+2)");
  }

  if (!result.dnssec.validating) {
    total += 3;
    reasons.push("DNSSEC not validating (+3)");
  }

  if (result.headers.fetched) {
    if (!result.headers.hsts) {
      total += 4;
      reasons.push("No HSTS header (+4)");
    }
    if (!result.headers.csp) {
      total += 3;
      reasons.push("No CSP header (+3)");
    }
  } else {
    total += 5;
    reasons.push("Could not fetch HTTPS response headers from the site (+5)");
  }

  if ((result.crt.subdomainCount ?? 0) > 50) {
    total += 5;
    reasons.push(`${result.crt.subdomainCount} subdomains found via crt.sh — large attack surface (+5)`);
  }

  if (result.shodan.fetched && result.shodan.vulns.length > 0) {
    const pts = Math.min(CVE_POINTS_CAP, result.shodan.vulns.length * CVE_POINTS_PER_VULN);
    total += pts;
    reasons.push(`${result.shodan.vulns.length} known CVE(s) on file for the resolved IP (+${pts})`);
  }

  if (result.tls.fetched) {
    if (result.tls.daysUntilExpiry !== null && result.tls.daysUntilExpiry < 0) {
      total += 8;
      reasons.push(`TLS certificate expired ${Math.abs(result.tls.daysUntilExpiry)} day(s) ago (+8)`);
    } else if (
      result.tls.daysUntilExpiry !== null &&
      result.tls.daysUntilExpiry >= 0 &&
      result.tls.daysUntilExpiry <= 30
    ) {
      total += 3;
      reasons.push(`TLS certificate expires in ${result.tls.daysUntilExpiry} day(s) (+3)`);
    }
    if (result.tls.selfSigned) {
      total += 6;
      reasons.push("TLS certificate is self-signed (+6)");
    }
    if (result.tls.protocol && WEAK_TLS_PROTOCOLS.includes(result.tls.protocol)) {
      total += 5;
      reasons.push(`Weak TLS protocol negotiated (${result.tls.protocol}) (+5)`);
    }
  }

  if (result.blacklist.fetched && result.blacklist.checked.some((c) => c.listedOn.length > 0)) {
    const listed = result.blacklist.checked.filter((c) => c.listedOn.length > 0);
    total += 8;
    reasons.push(
      `Listed on a DNS blacklist: ${listed.map((c) => `${c.ip} (${c.source}) on ${c.listedOn.join(", ")}`).join("; ")} (+8)`
    );
  }

  if (result.rdap.fetched && result.rdap.ageDays !== null && result.rdap.ageDays < NEW_DOMAIN_THRESHOLD_DAYS) {
    total += 4;
    reasons.push(`Domain registered only ${result.rdap.ageDays} day(s) ago (+4)`);
  }

  if (result.urlscan.fetched && result.urlscan.malicious === true) {
    total += 15;
    reasons.push("Latest urlscan.io scan flagged this domain as malicious (+15)");
  }

  if (result.headers.httpRedirectsToHttps === false) {
    total += 4;
    reasons.push("Plain HTTP does not redirect to HTTPS (+4)");
  }

  return { total: Math.min(SIGNAL_CAP, total), reasons };
}

export function tierFromResidual(residual: number): RiskTier {
  if (residual >= 70) return "CRITICAL";
  if (residual >= 50) return "HIGH";
  if (residual >= 25) return "MEDIUM";
  return "LOW";
}

export function computeUnifiedRisk({
  dataCategories,
  completedScores,
  latestOsintResult,
}: {
  dataCategories: DataCategory[];
  completedScores: number[];
  latestOsintResult: OsintResult | null;
}): UnifiedRisk {
  const inherent = computeInherentRisk(dataCategories);
  const control = computeControlScore(completedScores);
  const signals = computeResidualSignals(latestOsintResult);

  // No completed assessment means no evidence of mitigating controls yet,
  // so the full inherent risk carries through rather than being credited.
  const baseResidual = control === null ? inherent : Math.max(0, Math.round(inherent * (1 - control / 100)));
  const residual = Math.min(100, baseResidual + signals.total);

  return {
    inherent,
    control,
    residual,
    tier: tierFromResidual(residual),
    signalReasons: signals.reasons,
  };
}
