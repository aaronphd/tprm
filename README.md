# TPRM

A third-party risk management (TPRM) app: vendor inventory & risk tiering,
security questionnaires with automatic scoring, findings & remediation
tracking, and a risk dashboard.

Built with Next.js (App Router), TypeScript, Tailwind CSS, and Prisma
(SQLite).

## Getting started

```bash
npm install
cp .env.example .env             # sets DATABASE_URL; .env itself is gitignored
# open .env and set AUTH_SECRET — generate one with: openssl rand -base64 32
npx prisma migrate dev           # first run only: creates prisma/dev.db
npm run db:seed                  # seeds the questionnaire template + sample vendors
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=changeme npm run create-admin
npm run dev
```

Open http://localhost:3000 and log in with the admin account you just created.

On later runs, once `.env`, `prisma/dev.db`, and your admin account already exist, `npm run dev` alone is enough.

Every route requires a login (see `src/proxy.ts`) — there's no public page. Add more accounts the same way, by re-running `create-admin` with a different `ADMIN_EMAIL`/`ADMIN_PASSWORD`, or directly via `npx prisma studio`.

## What's here

- **Login** — every route is gated behind a session cookie (see
  "Deploying to a customer" below for how accounts get created). No
  self-serve signup; this is built for one company's/customer's internal
  use, not a multi-tenant SaaS.
- **Vendors** (`/vendors`) — inventory of third parties with risk tier
  (Critical/High/Medium/Low), status, ownership, and contract dates.
- **Assessments** (`/assessments`) — security questionnaires assigned to a
  vendor from a reusable template. Each answer is weighted; a vendor's score
  (0–100) is computed automatically as responses come in. Risky answers can
  be turned into findings with one click.
- **Findings** (`/findings`) — remediation items with severity, owner, and
  due date, either logged manually or generated from a flagged assessment
  answer.
- **Dashboard** (`/`) — vendor risk-tier breakdown, open findings by
  severity, overdue items, assessments in flight, a "Top vendors by
  residual risk" ranking (all vendors' unified risk scores, highest
  first) with a "Highest residual risk" stat card pointing at #1, an
  **upcoming contract renewals** radar (vendors whose contract ends within
  90 days, including already-expired ones), and an **assessment coverage
  gap** view (vendors with no completed assessment, each linking straight
  to "New assessment").
- **Unified Risk Score** (on each vendor's detail page) — combines
  inherent risk (which sensitive-data categories the vendor is classified
  as touching — student PII, PHI, PCI, financial, etc., each pre-weighted
  in `src/lib/types.ts`), control effectiveness (the average score across
  the vendor's completed assessments), and residual risk signal boosts
  computed automatically from its latest OSINT scan (missing DMARC/SPF/
  HSTS/CSP, unvalidated DNSSEC, a large subdomain count, known CVEs from
  Shodan, an expired/expiring/self-signed/weak-protocol TLS certificate, a
  DNS blacklist listing, a very recently registered domain, HTTP not
  redirecting to HTTPS, and a malicious urlscan.io verdict). Deliberately excludes anything that needs manual upkeep (breach
  history, financial health, etc.) — everything driving the score is
  either a one-time classification or already-collected data, so it can't
  silently go stale. Informational only — separate from, and doesn't
  overwrite, the vendor's manually-assigned risk tier. See
  `src/lib/unifiedRisk.ts`.
- **OSINT Snapshot** (on each vendor's detail page) — free, keyless outside-in
  recon, all run server-side (Server Action, so unlike a pure-browser
  version it isn't blocked by CORS on crt.sh, the target's headers, or the
  raw TLS handshake):
  - SPF/DMARC/DKIM/DNSSEC via Google's DNS-over-HTTPS
  - The vendor's own HTTPS response headers (HSTS/CSP/etc.) and whether
    plain HTTP redirects to HTTPS
  - Subdomain enumeration via certificate transparency (crt.sh)
  - **TLS certificate health** — a direct TLS handshake (Node's `tls`
    module, no external service) reads the actual certificate: expiry,
    issuer, negotiated protocol (flags TLS 1.0/1.1), self-signed detection
  - **DNS blacklist check** — reverse-DNS lookup against Spamhaus ZEN and
    SpamCop for the domain's IP and its mail server's IP
  - **Domain age** via RDAP (the free, keyless WHOIS replacement) —
    registration date, registrar, expiration
  - **security.txt presence** (RFC 9116) — a vulnerability-disclosure
    contact correlates with security maturity
  - Known open ports/CVEs via Shodan's free InternetDB lookup (no API key,
    no active scanning by this app — it reads whatever Shodan already has
    on file for the vendor's IP)
  - **urlscan.io scan history** — keyless public Search API; whether the
    domain's most recent scan (by anyone) was flagged malicious

  Point-in-time snapshot, not continuous monitoring. Below that, one-click
  deep links into SSL Labs, Mozilla Observatory, Security Headers,
  MXToolbox, Shodan (full search UI), Censys, urlscan.io (full scan
  history), VirusTotal, HIBP, Google Safe Browsing, and DNSViz, plus a
  notes field to paste findings back. See `src/lib/osint/`.
- **Vendor risk report** (`/vendors/[id]/report`, linked as "View report"
  on the vendor page) — a print-optimized one-page summary combining the
  overview, unified risk score breakdown, latest OSINT snapshot, full
  assessment history, documents & evidence, and findings. Uses the
  browser's native print/"Save as PDF" (no PDF library or external
  service) — the nav and page chrome are hidden via `print:` CSS when
  printing.
- **Documents & Evidence** (on each vendor's detail page) — links out to
  evidence that lives elsewhere: a signed DPA, insurance certificate,
  SOC 2 report, or a full ISO 27001 Annex A / SOC 2 readiness workbook
  produced by a separate tool. This app stores a title, URL, and optional
  note per link — not the file and not the underlying control-by-control
  data. (Deliberately out of scope here: the full 93-control ISO 27001
  Annex A checklist and the full SOC 2 Trust Services Criteria are
  audit/implementation checklists for your own ISMS — a different shape
  of tool than vendor risk screening. The `control-mapping-engine` and
  `soc2-readiness-assessor` skills in this environment are purpose-built
  for that.)

## Data model

See `prisma/schema.prisma`. SQLite has no native enum type, so status/tier/
severity fields are plain strings constrained by the TypeScript literal
types in `src/lib/types.ts`.

Six questionnaire templates ship in `prisma/seed.ts`:

- **Standard Vendor Security Assessment** — general-purpose baseline
  covering data security, access control, incident response, business
  continuity, compliance & legal, and subprocessor/fourth-party risk.
- **HECVAT-Lite (K-12 Adapted)** — an earlier, self-authored adaptation of
  the HECVAT-Lite structure for public school ed-tech procurement. Kept
  around (not deleted — Prisma won't let you delete a template with
  existing assessments against it) now that the real one below exists;
  prefer that one for new assessments.
- **HECVAT Lite** — sourced from EDUCAUSE's Higher Education Community
  Vendor Assessment Toolkit. 53 questions across the source document's 12
  sections, converted into this app's weighted yes/no/partial/N/A scoring
  model; purely descriptive items (company overview, hosting location,
  RTO/RPO, etc.) are kept as unscored informational questions answered via
  notes. **Not a pixel-for-pixel reproduction of the official
  spreadsheet** — treat EDUCAUSE's document as authoritative for a formal
  HECVAT exchange with a vendor. The consolidated HECVAT 4.1.5
  (Full/Lite/On-Prem merged, 321 questions) exists but isn't ported here.
- **HECVAT-AI Addendum** — sourced from EDUCAUSE, pairs with HECVAT Lite
  for a vendor whose product uses AI: model use, training-data provenance
  and opt-out, transparency & governance (NIST AI RMF / ISO 42001
  alignment).
- **The Isaacs Group — Privacy & Compliance Assessment** — original
  questionnaire (not derived from any single external framework) covering
  FERPA, COPPA, PHI/HIPAA, a consolidated U.S. state privacy & breach-
  notification law baseline (not 50 individual per-state items), SOC 2,
  and ISO/IEC 27001.
- **SIG-Parallel Lite (Isaacs)** — original Isaacs Group questionnaire
  covering the eighteen risk domains addressed by Shared Assessments' SIG,
  in independent wording (not derived from SIG's proprietary question
  text) — use when a SIG license isn't available.

All six are assignable per-vendor from the "New assessment" screen. Edit
`prisma/seed.ts` and re-run `npm run db:seed` to change any of them (it's
idempotent — re-running it won't duplicate existing vendors/templates), or
add more templates directly via Prisma Studio (`npx prisma studio`).

## Deploying to a customer (self-hosted)

Packaged as a single Docker image with a persistent SQLite volume — one
container per customer, no shared multi-tenant infrastructure.

```bash
cp .env.example .env
# set in .env:
#   AUTH_SECRET      — openssl rand -base64 32
#   ADMIN_EMAIL      — the customer's first login
#   ADMIN_PASSWORD   — temporary; tell them to change it via Prisma Studio,
#                      or just re-run create-admin with a new account later
#   TRIAL_ENDS_AT    — optional, e.g. 2026-09-30, for a time-boxed trial

docker compose up -d --build
```

That builds the image (multi-stage `Dockerfile`, Next.js standalone
output), and on every container start (`docker-entrypoint.sh`) runs
`prisma migrate deploy` against the volume-backed database and creates the
admin account from `ADMIN_EMAIL`/`ADMIN_PASSWORD` if it doesn't exist yet
(`scripts/bootstrap-admin.js` — safe to leave those two vars set
permanently; it no-ops once the account exists). The app is then reachable
on port 3000; put it behind a reverse proxy (nginx, Caddy, Cloudflare
Tunnel, etc.) for TLS and a real domain.

**Auth**: every route requires a login (`src/proxy.ts` — Next.js 16's
proxy, née middleware — checks a signed session cookie). There's no
self-serve signup; accounts are created via `ADMIN_EMAIL`/`ADMIN_PASSWORD`
or `npx prisma studio` inside the running container. Sessions are
stateless (HMAC-signed with `AUTH_SECRET`, no session table), so rotating
`AUTH_SECRET` invalidates every logged-in session — useful if it ever
leaks.

**Trial expiration**: set `TRIAL_ENDS_AT` and every route redirects to a
"trial has ended" page once that date passes, until it's unset or moved
out (no license server, just a date check in the proxy).

**Data**: everything lives in the `tprm-data` named volume as one SQLite
file (`/app/data/prod.db` inside the container). Back it up with:

```bash
docker compose exec app sh -c 'sqlite3 /app/data/prod.db ".backup /app/data/backup.db"' \
  && docker compose cp app:/app/data/backup.db ./backup-$(date +%F).db
```

Upgrading to a new version: pull the new code, `docker compose up -d --build`
— the entrypoint's `prisma migrate deploy` applies any new migrations
against the existing volume automatically.

## Useful commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | Lint |
| `npm run db:seed` | Seed the questionnaire template + sample data |
| `npm run db:reset` | Drop and recreate the local database |
| `npx prisma studio` | Browse/edit the SQLite database in a GUI |
