import tls from "node:tls";
import type {
  BlacklistResult,
  CrtResult,
  DkimResult,
  DmarcResult,
  DnsblCheck,
  DohResponse,
  ExternalCheckLink,
  HeadersResult,
  OsintResult,
  RdapResult,
  SecurityTxtResult,
  ShodanResult,
  SpfResult,
  TlsCertResult,
  UrlscanResult,
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

async function checkHttpRedirectsToHttps(domain: string): Promise<boolean | null> {
  try {
    const r = await fetch(`http://${domain}/`, {
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "User-Agent": "tprm-osint-toolkit/1.0" },
    });
    return r.url.startsWith("https://");
  } catch {
    // Couldn't connect on plain port 80 at all -- inconclusive, not
    // necessarily bad (some setups block it outright rather than redirect).
    return null;
  }
}

async function lookupHeaders(domain: string): Promise<HeadersResult> {
  const httpRedirectsPromise = checkHttpRedirectsToHttps(domain);
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
      httpRedirectsToHttps: await httpRedirectsPromise,
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
      httpRedirectsToHttps: await httpRedirectsPromise,
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

// Shodan's InternetDB is free and keyless: it returns whatever Shodan
// already has on file for an IP (open ports, known CVEs, tags) from its
// own passive internet-wide scanning. This app performs no active
// scanning of its own -- it's a lookup against Shodan's existing data.
// Takes the already-resolved A record IP (see scanDomain) rather than
// resolving its own, since the blacklist check needs the same IP.
async function lookupShodanWithIp(ip: string | null): Promise<ShodanResult> {
  const empty = { ports: [], vulns: [], tags: [], hostnames: [] };
  if (!ip) {
    return { fetched: false, error: "No A record found to look up", ip: null, ...empty };
  }
  try {
    const r = await fetch(`https://internetdb.shodan.io/${ip}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (r.status === 404) {
      // Shodan has no data on file for this IP -- not an error, just empty.
      return { fetched: true, error: null, ip, ...empty };
    }
    if (!r.ok) throw new Error(`HTTP ${r.status}`);

    const data = (await r.json()) as {
      ports?: number[];
      vulns?: string[];
      tags?: string[];
      hostnames?: string[];
    };
    return {
      fetched: true,
      error: null,
      ip,
      ports: data.ports ?? [],
      vulns: data.vulns ?? [],
      tags: data.tags ?? [],
      hostnames: data.hostnames ?? [],
    };
  } catch (e) {
    return { fetched: false, error: e instanceof Error ? e.message : String(e), ip, ...empty };
  }
}

// Direct TLS handshake -- no external service, so nothing here can be
// blocked by a third party's rate limit or availability. rejectUnauthorized
// is deliberately false: we want to inspect the certificate even when it's
// invalid or self-signed (that's itself a finding), and this connection is
// used only to read the handshake metadata, never to exchange data.
async function lookupTlsCertificate(domain: string): Promise<TlsCertResult> {
  const empty = {
    issuer: null,
    subject: null,
    validFrom: null,
    validTo: null,
    daysUntilExpiry: null,
    protocol: null,
    selfSigned: false,
  };

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: TlsCertResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const socket = tls.connect(
      {
        host: domain,
        port: 443,
        servername: domain,
        rejectUnauthorized: false,
        timeout: FETCH_TIMEOUT_MS,
      },
      () => {
        const cert = socket.getPeerCertificate();
        const protocol = socket.getProtocol();
        socket.end();

        if (!cert || Object.keys(cert).length === 0) {
          finish({ fetched: false, error: "No certificate returned", ...empty });
          return;
        }

        const validTo = cert.valid_to ? new Date(cert.valid_to) : null;
        const validFrom = cert.valid_from ? new Date(cert.valid_from) : null;
        const daysUntilExpiry =
          validTo && !Number.isNaN(validTo.getTime())
            ? Math.ceil((validTo.getTime() - Date.now()) / 86400000)
            : null;
        const selfSigned = Boolean(
          cert.issuer && cert.subject && JSON.stringify(cert.issuer) === JSON.stringify(cert.subject)
        );

        const asString = (v: string | string[] | undefined): string | null =>
          Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

        finish({
          fetched: true,
          error: null,
          issuer: asString(cert.issuer?.O) || asString(cert.issuer?.CN),
          subject: asString(cert.subject?.CN),
          validFrom: validFrom && !Number.isNaN(validFrom.getTime()) ? validFrom.toISOString() : null,
          validTo: validTo && !Number.isNaN(validTo.getTime()) ? validTo.toISOString() : null,
          daysUntilExpiry,
          protocol: protocol ?? null,
          selfSigned,
        });
      }
    );

    socket.on("error", (e) => finish({ fetched: false, error: e.message, ...empty }));
    socket.on("timeout", () => {
      socket.destroy();
      finish({ fetched: false, error: "Connection timed out", ...empty });
    });
  });
}

const DNSBL_ZONES = ["zen.spamhaus.org", "bl.spamcop.net"];

async function checkDnsblZones(ip: string): Promise<string[]> {
  const reversed = ip.split(".").reverse().join(".");
  const results = await Promise.all(
    DNSBL_ZONES.map(async (zone) => {
      try {
        const res = await doh(`${reversed}.${zone}`, "A");
        return res.Status === 0 && (res.Answer || []).length > 0 ? zone : null;
      } catch {
        return null;
      }
    })
  );
  return results.filter((z): z is string => Boolean(z));
}

// Reverse-DNS blacklist check against Spamhaus ZEN + SpamCop -- both
// queryable over plain DNS (no API key). Checks the domain's own resolved
// IP and, separately, its mail server's IP if it has one. Low-volume,
// occasional lookups like this are well within normal acceptable use for
// these lists; this isn't a bulk/automated scanning tool.
async function lookupBlacklists(domain: string, ip: string | null): Promise<BlacklistResult> {
  const targets: { ip: string; source: string }[] = [];
  if (ip) targets.push({ ip, source: "domain A record" });

  try {
    const mxRes = await doh(domain, "MX");
    const mxData = (mxRes.Answer || [])[0]?.data;
    const mxHost = mxData?.trim().split(/\s+/).pop()?.replace(/\.$/, "");
    if (mxHost) {
      const mxARes = await doh(mxHost, "A");
      const mxIp = (mxARes.Answer || []).find((a) => a.type === 1)?.data;
      if (mxIp && mxIp !== ip) targets.push({ ip: mxIp, source: `mail server (${mxHost})` });
    }
  } catch {
    // No MX record or resolution failed -- proceed with whatever targets exist.
  }

  if (targets.length === 0) {
    return { fetched: false, error: "No IP addresses found to check", checked: [] };
  }

  const checked: DnsblCheck[] = await Promise.all(
    targets.map(async (t) => ({ ip: t.ip, source: t.source, listedOn: await checkDnsblZones(t.ip) }))
  );
  return { fetched: true, error: null, checked };
}

type RdapVcardField = [string, Record<string, unknown>, string, ...unknown[]];
type RdapEntity = { roles?: string[]; handle?: string; vcardArray?: [string, RdapVcardField[]] };
type RdapResponseShape = { events?: { eventAction?: string; eventDate?: string }[]; entities?: RdapEntity[] };

function extractRegistrarName(entities: RdapEntity[] | undefined): string | null {
  const registrar = (entities || []).find((e) => (e.roles || []).includes("registrar"));
  if (!registrar) return null;
  const vcard = registrar.vcardArray?.[1];
  if (Array.isArray(vcard)) {
    const fn = vcard.find((v) => Array.isArray(v) && v[0] === "fn");
    if (fn && typeof fn[3] === "string") return fn[3];
  }
  return registrar.handle ?? null;
}

// RDAP is the free, keyless, standardized WHOIS replacement. rdap.org runs
// a public bootstrap proxy that redirects to the right registry for
// whatever TLD the domain is under, so this app doesn't need its own
// per-TLD bootstrap logic.
async function lookupRdap(domain: string): Promise<RdapResult> {
  try {
    const r = await fetch(`https://rdap.org/domain/${domain}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: "application/rdap+json" },
      redirect: "follow",
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = (await r.json()) as RdapResponseShape;
    const events = data.events || [];
    const registeredOn = events.find((e) => e.eventAction === "registration")?.eventDate ?? null;
    const expiresOn = events.find((e) => e.eventAction === "expiration")?.eventDate ?? null;
    const ageDays = registeredOn
      ? Math.floor((Date.now() - new Date(registeredOn).getTime()) / 86400000)
      : null;
    return {
      fetched: true,
      error: null,
      registeredOn,
      expiresOn,
      ageDays,
      registrar: extractRegistrarName(data.entities),
    };
  } catch (e) {
    return {
      fetched: false,
      error: e instanceof Error ? e.message : String(e),
      registeredOn: null,
      expiresOn: null,
      ageDays: null,
      registrar: null,
    };
  }
}

// RFC 9116 security.txt -- presence correlates with the vendor actually
// having a vulnerability-disclosure process. Checks the current canonical
// location first, then falls back to the older root-level path.
async function lookupSecurityTxt(domain: string): Promise<SecurityTxtResult> {
  const candidates = [`https://${domain}/.well-known/security.txt`, `https://${domain}/security.txt`];
  let lastError: string | null = null;

  for (const url of candidates) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), redirect: "follow" });
      if (r.ok) {
        const text = await r.text();
        const contact = text
          .split("\n")
          .filter((l) => l.trim().toLowerCase().startsWith("contact:"))
          .map((l) => l.slice(l.indexOf(":") + 1).trim());
        return { fetched: true, present: true, url, contact: contact.length ? contact : null, error: null };
      }
      lastError = null; // a clean 404 is absence, not an error
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }
  return { fetched: lastError === null, present: false, url: null, contact: null, error: lastError };
}

// urlscan.io's public Search API is keyless (read-only, no scan submitted
// by this app). Finds prior scans of the domain by anyone; for the most
// recent one, a second lookup against the full result endpoint gets its
// verdict (search hits themselves don't reliably include one).
async function lookupUrlscan(domain: string): Promise<UrlscanResult> {
  const empty = { totalScans: 0, latestScanUrl: null, latestScanDate: null, malicious: null, maliciousScore: null };
  try {
    const r = await fetch(
      `https://urlscan.io/api/v1/search/?q=domain:${encodeURIComponent(domain)}&size=10`,
      { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
    );
    if (!r.ok) throw new Error(`HTTP ${r.status}`);

    const data = (await r.json()) as {
      total?: number;
      results?: { _id: string; task?: { time?: string } }[];
    };
    const totalScans = data.total ?? (data.results || []).length;
    const latest = (data.results || [])[0];
    if (!latest) {
      return { fetched: true, error: null, ...empty };
    }

    let malicious: boolean | null = null;
    let maliciousScore: number | null = null;
    try {
      const detailRes = await fetch(`https://urlscan.io/api/v1/result/${latest._id}/`, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (detailRes.ok) {
        const detail = (await detailRes.json()) as {
          verdicts?: { overall?: { malicious?: boolean; score?: number } };
        };
        malicious = detail.verdicts?.overall?.malicious ?? null;
        maliciousScore = detail.verdicts?.overall?.score ?? null;
      }
    } catch {
      // Verdict detail is best-effort -- scan count/date are still useful without it.
    }

    return {
      fetched: true,
      error: null,
      totalScans,
      latestScanUrl: `https://urlscan.io/result/${latest._id}/`,
      latestScanDate: latest.task?.time ?? null,
      malicious,
      maliciousScore,
    };
  } catch (e) {
    return { fetched: false, error: e instanceof Error ? e.message : String(e), ...empty };
  }
}

export async function scanDomain(rawInput: string): Promise<OsintResult> {
  const domain = cleanDomain(rawInput);
  const validationError = validateDomain(domain);
  if (validationError) throw new Error(validationError);

  const errors: string[] = [];

  // Resolved once and shared by both the Shodan and blacklist checks.
  let ip: string | null = null;
  try {
    const aRes = await doh(domain, "A");
    ip = (aRes.Answer || []).find((a) => a.type === 1)?.data ?? null;
  } catch {
    // Downstream checks handle a null IP gracefully.
  }

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
      httpRedirectsToHttps: null,
    },
    crt: { fetched: false, error: null, subdomainCount: null, subdomains: [], truncated: false },
    shodan: { fetched: false, error: null, ip: null, ports: [], vulns: [], tags: [], hostnames: [] },
    tls: {
      fetched: false,
      error: null,
      issuer: null,
      subject: null,
      validFrom: null,
      validTo: null,
      daysUntilExpiry: null,
      protocol: null,
      selfSigned: false,
    },
    blacklist: { fetched: false, error: null, checked: [] },
    rdap: { fetched: false, error: null, registeredOn: null, expiresOn: null, ageDays: null, registrar: null },
    securityTxt: { fetched: false, present: false, url: null, contact: null, error: null },
    urlscan: {
      fetched: false,
      error: null,
      totalScans: 0,
      latestScanUrl: null,
      latestScanDate: null,
      malicious: null,
      maliciousScore: null,
    },
    errors,
  };

  const [
    txtRes,
    dmarcRes,
    mxRes,
    dsRes,
    dkimRes,
    headersRes,
    crtRes,
    shodanRes,
    tlsRes,
    blacklistRes,
    rdapRes,
    securityTxtRes,
    urlscanRes,
  ] = await Promise.allSettled([
    doh(domain, "TXT"),
    doh(`_dmarc.${domain}`, "TXT"),
    doh(domain, "MX"),
    doh(domain, "DS"),
    lookupDkim(domain),
    lookupHeaders(domain),
    lookupCrtSh(domain),
    lookupShodanWithIp(ip),
    lookupTlsCertificate(domain),
    lookupBlacklists(domain, ip),
    lookupRdap(domain),
    lookupSecurityTxt(domain),
    lookupUrlscan(domain),
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

  if (shodanRes.status === "fulfilled") {
    result.shodan = shodanRes.value;
    if (shodanRes.value.error) errors.push(`Shodan InternetDB: ${shodanRes.value.error}`);
  }

  if (tlsRes.status === "fulfilled") {
    result.tls = tlsRes.value;
    if (tlsRes.value.error) errors.push(`TLS certificate: ${tlsRes.value.error}`);
  }

  if (blacklistRes.status === "fulfilled") {
    result.blacklist = blacklistRes.value;
    if (blacklistRes.value.error) errors.push(`Blacklist check: ${blacklistRes.value.error}`);
  }

  if (rdapRes.status === "fulfilled") {
    result.rdap = rdapRes.value;
    if (rdapRes.value.error) errors.push(`RDAP: ${rdapRes.value.error}`);
  }

  if (securityTxtRes.status === "fulfilled") {
    result.securityTxt = securityTxtRes.value;
    if (securityTxtRes.value.error) errors.push(`security.txt: ${securityTxtRes.value.error}`);
  }

  if (urlscanRes.status === "fulfilled") {
    result.urlscan = urlscanRes.value;
    if (urlscanRes.value.error) errors.push(`urlscan.io: ${urlscanRes.value.error}`);
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
    { name: "Shodan", url: `https://www.shodan.io/search?query=hostname%3A${d}`, purpose: "Full search UI (the scan above already pulls InternetDB)" },
    { name: "Censys", url: `https://search.censys.io/search?resource=hosts&q=${d}`, purpose: "Hosts + certificates" },
    { name: "crt.sh", url: `https://crt.sh/?q=%25.${d}`, purpose: "Certificate transparency (full list)" },
    { name: "urlscan.io", url: `https://urlscan.io/search/#domain%3A${d}`, purpose: "Full scan history (the scan above already checks the latest verdict)" },
    { name: "VirusTotal", url: `https://www.virustotal.com/gui/domain/${d}`, purpose: "Threat intel aggregation" },
    { name: "HIBP", url: `https://haveibeenpwned.com/DomainSearch`, purpose: "Breach exposure (requires domain verification)" },
    { name: "Google Safe Browsing", url: `https://transparencyreport.google.com/safe-browsing/search?url=${d}`, purpose: "Malicious content check" },
    { name: "DNSViz", url: `https://dnsviz.net/d/${d}/dnssec/`, purpose: "DNSSEC chain verification" },
  ];
}
