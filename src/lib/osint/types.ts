export type SpfResult = {
  present: boolean;
  policy?: string;
  raw?: string;
};

export type DmarcResult = {
  present: boolean;
  policy?: string;
  pct?: string;
  raw?: string;
};

export type DkimResult = {
  present: boolean;
  selectorsChecked: string[];
  selectorsFound: string[];
};

export type DnssecResult = {
  validating: boolean;
  dsPresent: boolean;
};

export type HeadersResult = {
  fetched: boolean;
  error: string | null;
  statusCode: number | null;
  hsts: string | null;
  csp: string | null;
  xFrameOptions: string | null;
  xContentTypeOptions: string | null;
  referrerPolicy: string | null;
  // null = couldn't determine (e.g. plain port 80 unreachable, which on
  // its own isn't necessarily bad -- some setups block it entirely).
  httpRedirectsToHttps: boolean | null;
};

// Read directly off the certificate via a raw TLS handshake -- no
// external service involved, so this isn't blocked by anything a
// third-party API might rate-limit or restrict.
export type TlsCertResult = {
  fetched: boolean;
  error: string | null;
  issuer: string | null;
  subject: string | null;
  validFrom: string | null;
  validTo: string | null;
  daysUntilExpiry: number | null;
  protocol: string | null; // e.g. "TLSv1.3", "TLSv1.2"
  selfSigned: boolean;
};

export type DnsblCheck = {
  ip: string;
  source: string; // e.g. "domain A record", "mail server (mx1.example.com)"
  listedOn: string[]; // DNSBL zone names it's listed on, empty if clean
};

export type BlacklistResult = {
  fetched: boolean;
  error: string | null;
  checked: DnsblCheck[];
};

export type RdapResult = {
  fetched: boolean;
  error: string | null;
  registeredOn: string | null;
  expiresOn: string | null;
  ageDays: number | null;
  registrar: string | null;
};

export type SecurityTxtResult = {
  fetched: boolean;
  present: boolean;
  url: string | null;
  contact: string[] | null;
  error: string | null;
};

export type CrtResult = {
  fetched: boolean;
  error: string | null;
  subdomainCount: number | null;
  subdomains: string[];
  truncated: boolean;
};

// Shodan's free, keyless InternetDB endpoint (internetdb.shodan.io) --
// looks up whatever Shodan already has on file for an IP: no active
// scanning is performed by this app.
export type ShodanResult = {
  fetched: boolean;
  error: string | null;
  ip: string | null;
  ports: number[];
  vulns: string[];
  tags: string[];
  hostnames: string[];
};

// urlscan.io's public Search API is keyless. This app performs no scan
// submissions of its own -- only reads scans other users/scanners have
// already run against the domain.
export type UrlscanResult = {
  fetched: boolean;
  error: string | null;
  totalScans: number;
  latestScanUrl: string | null;
  latestScanDate: string | null;
  malicious: boolean | null; // null = no scan found, or verdict unavailable
  maliciousScore: number | null;
};

export type OsintResult = {
  domain: string;
  scannedAt: string;
  spf: SpfResult;
  dmarc: DmarcResult;
  dkim: DkimResult;
  dnssec: DnssecResult;
  mx: string[];
  headers: HeadersResult;
  crt: CrtResult;
  shodan: ShodanResult;
  tls: TlsCertResult;
  blacklist: BlacklistResult;
  rdap: RdapResult;
  securityTxt: SecurityTxtResult;
  urlscan: UrlscanResult;
  errors: string[];
};

export type ExternalCheckLink = {
  name: string;
  url: string;
  purpose: string;
};

// Shape of Google's DNS-over-HTTPS JSON API response
// (https://dns.google/resolve?...). Only the fields this app reads.
export type DohAnswer = {
  name: string;
  type: number;
  TTL: number;
  data: string;
};

export type DohResponse = {
  Status: number;
  AD?: boolean;
  Answer?: DohAnswer[];
};
