import type {
  CrtResult,
  DkimResult,
  DmarcResult,
  DohResponse,
  ExternalCheckLink,
  HeadersResult,
  OsintResult,
  SpfResult,
} from "@/lib/osint/types";

// Free, keyless OSINT lookups run server-side (this app already has a
// server, so unlike a pure-browser version there's no CORS limitation on
// crt.sh or the vendor's own HTTPS response headers). Snapshot-in-time,
// not continuous monitoring -- see the "manual checks" deep links for the
// rest of what a paid tool like BitSight/SecurityScorecard would surface.

const FETCH_TIMEOUT_MS = 8000;

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^0\.0\.0\.0$/,
  /^\[?::1\]?$/,
  /\.local$/i,
  /\.internal$/i,
];

export function cleanDomain(input: string): string {
  if (!input) return "";
  return String(input)
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./i, "")
    .toLowerCase()
    .trim();
}

export function validateDomain(domain: string): string | null {
  if (!domain || !domain.includes(".")) {
    return "Enter a valid domain (e.g. example.com).";
  }
  if (!/^[a-z0-9.-]+$/.test(domain)) {
    return "Domain contains characters that aren't valid in a hostname.";
  }
  if (PRIVATE_HOST_PATTERNS.some((p) => p.test(domain))) {
    return "Refusing to scan a private/internal-looking hostname.";
  }
  return null;
}

async function doh(name: string, type: string): Promise<DohResponse> {
  const url = `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}&do=1`;
  const r = await fetch(url, {
    headers: { Accept: "application/dns-json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!r.ok) throw new Error(`DoH ${type} failed (${r.status})`);
  return r.json();
}

function extractTxt(dohResponse: DohResponse): string[] {
  return (dohResponse?.Answer || [])
    .filter((a) => a.type === 16 || a.type === undefined)
    .map((a) => String(a.data || "").replace(/^"|"$/g, "").replace(/""/g, ""));
}

function parseSpf(records: string[]): SpfResult {
  const spf = records.find((r) => r.toLowerCase().startsWith("v=spf1"));
  if (!spf) return { present: false };
  const m = spf.toLowerCase().match(/([+\-~?])all/);
  const qualifier = m ? m[1] : null;
  const policy =
    { "-": "hard fail (-all)", "~": "soft fail (~all)", "?": "neutral (?all)", "+": "pass (+all)" }[
      qualifier ?? ""
    ] ?? "unknown";
  return { present: true, policy, raw: spf };
}

function parseDmarc(records: string[]): DmarcResult {
  const dmarc = records.find((r) => r.toLowerCase().startsWith("v=dmarc1"));
  if (!dmarc) return { present: false };
  const p = dmarc.toLowerCase().match(/p=(reject|quarantine|none)/)?.[1] ?? "none";
  const pct = dmarc.match(/pct=(\d+)/i)?.[1] ?? "100";
  return { present: true, policy: p, pct, raw: dmarc };
}

const COMMON_DKIM_SELECTORS = [
  "default",
  "google",
  "selector1",
  "selector2",
  "k1",
  "k2",
  "mail",
  "dkim",
  "s1",
  "s2",
  "mandrill",
  "mailgun",
  "sendgrid",
  "zoho",
];

async function lookupDkim(domain: string): Promise<DkimResult> {
  const found = await Promise.all(
    COMMON_DKIM_SELECTORS.map((sel) =>
      doh(`${sel}._domainkey.${domain}`, "TXT")
        .then((res) => ((res.Answer || []).length > 0 ? sel : null))
        .catch(() => null)
    )
  );
  const selectorsFound = found.filter((s): s is string => Boolean(s));
  return {
    present: selectorsFound.length > 0,
    selectorsChecked: COMMON_DKIM_SELECTORS,
    selectorsFound,
  };
}

async function lookupHeaders(domain: string): Promise<HeadersResult> {
  try {
    const r = await fetch(`https://${domain}/`, {
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "User-Agent": "tprm-osint-toolkit/1.0" },
    });
    return {
      fetched: true,
      error: null,
      statusCode: r.status,
      hsts: r.headers.get("strict-transport-security"),
      csp: r.headers.get("content-security-policy"),
      xFrameOptions: r.headers.get("x-frame-options"),
      xContentTypeOptions: r.headers.get("x-content-type-options"),
      referrerPolicy: r.headers.get("referrer-policy"),
    };
  } catch (e) {
    return {
      fetched: false,
      error: e instanceof Error ? e.message : String(e),
      statusCode: null,
      hsts: null,
      csp: null,
      xFrameOptions: null,
      xContentTypeOptions: null,
      referrerPolicy: null,
    };
  }
}

async function lookupCrtSh(domain: string): Promise<CrtResult> {
  try {
    const r = await fetch(`https://crt.sh/?q=%25.${domain}&output=json`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = (await r.json()) as { name_value?: string; common_name?: string }[];
    const subs = new Set<string>();
    (data || []).forEach((cert) => {
      const val = cert.name_value || cert.common_name || "";
      val.split("\n").forEach((name) => {
        const c = name.trim().replace(/^\*\./, "").toLowerCase();
        if (c && (c === domain || c.endsWith("." + domain))) subs.add(c);
      });
    });
    const list = Array.from(subs).sort();
    return {
      fetched: true,
      error: null,
      subdomainCount: subs.size,
      subdomains: list.slice(0, 200),
      truncated: list.length > 200,
    };
  } catch (e) {
    return {
      fetched: false,
      error: e instanceof Error ? e.message : String(e),
      subdomainCount: null,
      subdomains: [],
      truncated: false,
    };
  }
}

export async function scanDomain(rawInput: string): Promise<OsintResult> {
  const domain = cleanDomain(rawInput);
  const validationError = validateDomain(domain);
  if (validationError) throw new Error(validationError);

  const errors: string[] = [];
  const result: OsintResult = {
    domain,
    scannedAt: new Date().toISOString(),
    spf: { present: false },
    dmarc: { present: false },
    dkim: { present: false, selectorsChecked: COMMON_DKIM_SELECTORS, selectorsFound: [] },
    dnssec: { validating: false, dsPresent: false },
    mx: [],
    headers: {
      fetched: false,
      error: null,
      statusCode: null,
      hsts: null,
      csp: null,
      xFrameOptions: null,
      xContentTypeOptions: null,
      referrerPolicy: null,
    },
    crt: { fetched: false, error: null, subdomainCount: null, subdomains: [], truncated: false },
    errors,
  };

  const [txtRes, dmarcRes, mxRes, dsRes, dkimRes, headersRes, crtRes] = await Promise.allSettled([
    doh(domain, "TXT"),
    doh(`_dmarc.${domain}`, "TXT"),
    doh(domain, "MX"),
    doh(domain, "DS"),
    lookupDkim(domain),
    lookupHeaders(domain),
    lookupCrtSh(domain),
  ]);

  if (txtRes.status === "fulfilled") {
    result.spf = parseSpf(extractTxt(txtRes.value));
    result.dnssec.validating = txtRes.value.AD === true;
  } else {
    errors.push(`TXT/${domain}: ${txtRes.reason?.message ?? txtRes.reason}`);
  }

  if (dmarcRes.status === "fulfilled") {
    result.dmarc = parseDmarc(extractTxt(dmarcRes.value));
  } else {
    errors.push(`DMARC: ${dmarcRes.reason?.message ?? dmarcRes.reason}`);
  }

  if (mxRes.status === "fulfilled") {
    result.mx = (mxRes.value.Answer || []).map((a) => a.data).filter(Boolean);
  }

  if (dsRes.status === "fulfilled") {
    result.dnssec.dsPresent = (dsRes.value.Answer || []).length > 0;
  }

  if (dkimRes.status === "fulfilled") {
    result.dkim = dkimRes.value;
  } else {
    errors.push(`DKIM: ${dkimRes.reason?.message ?? dkimRes.reason}`);
  }

  if (headersRes.status === "fulfilled") {
    result.headers = headersRes.value;
    if (headersRes.value.error) errors.push(`HTTPS headers: ${headersRes.value.error}`);
  }

  if (crtRes.status === "fulfilled") {
    result.crt = crtRes.value;
    if (crtRes.value.error) errors.push(`crt.sh: ${crtRes.value.error}`);
  }

  return result;
}

// One-click deep links into third-party OSINT tools that a reviewer runs
// manually and pastes the result back (see manualNotes on OsintScan).
// These are convenience URLs into external services this app doesn't
// control -- if a service changes its query-string format the link may
// land on the tool's homepage instead of a pre-filled result; the domain
// itself is always shown alongside so it's a quick paste either way.
export function externalCheckLinks(domain: string): ExternalCheckLink[] {
  const d = cleanDomain(domain);
  if (!d) return [];
  return [
    { name: "SSL Labs", url: `https://www.ssllabs.com/ssltest/analyze.html?d=${d}&hideResults=on`, purpose: "TLS/SSL grade" },
    { name: "Mozilla Observatory", url: `https://developer.mozilla.org/en-US/observatory/analyze?host=${d}`, purpose: "HTTP security headers" },
    { name: "Security Headers", url: `https://securityheaders.com/?q=${d}&followRedirects=on`, purpose: "Header grade (A+ to F)" },
    { name: "MXToolbox", url: `https://mxtoolbox.com/SuperTool.aspx?action=blacklist%3a${d}&run=toolpage`, purpose: "Blacklist + DNS health" },
    { name: "Shodan", url: `https://www.shodan.io/search?query=hostname%3A${d}`, purpose: "Exposed services" },
    { name: "Censys", url: `https://search.censys.io/search?resource=hosts&q=${d}`, purpose: "Hosts + certificates" },
    { name: "crt.sh", url: `https://crt.sh/?q=%25.${d}`, purpose: "Certificate transparency (full list)" },
    { name: "urlscan.io", url: `https://urlscan.io/search/#domain%3A${d}`, purpose: "Recent scans + verdicts" },
    { name: "VirusTotal", url: `https://www.virustotal.com/gui/domain/${d}`, purpose: "Threat intel aggregation" },
    { name: "HIBP", url: `https://haveibeenpwned.com/DomainSearch`, purpose: "Breach exposure (requires domain verification)" },
    { name: "Google Safe Browsing", url: `https://transparencyreport.google.com/safe-browsing/search?url=${d}`, purpose: "Malicious content check" },
    { name: "DNSViz", url: `https://dnsviz.net/d/${d}/dnssec/`, purpose: "DNSSEC chain verification" },
  ];
}
