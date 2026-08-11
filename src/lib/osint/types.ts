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
};

export type CrtResult = {
  fetched: boolean;
  error: string | null;
  subdomainCount: number | null;
  subdomains: string[];
  truncated: boolean;
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
