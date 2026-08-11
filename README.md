# TPRM

A third-party risk management (TPRM) app: vendor inventory & risk tiering,
security questionnaires with automatic scoring, findings & remediation
tracking, and a risk dashboard.

Built with Next.js (App Router), TypeScript, Tailwind CSS, and Prisma
(SQLite).

## Getting started

```bash
npm install
cp .env.example .env   # sets DATABASE_URL; .env itself is gitignored
npx prisma migrate dev # first run only: creates prisma/dev.db
npm run db:seed        # seeds the questionnaire template + sample vendors
npm run dev
```

Open http://localhost:3000.

On later runs, once `.env` and `prisma/dev.db` already exist, `npm run dev` alone is enough.

## What's here

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
  severity, overdue items, and assessments in flight.
- **OSINT Snapshot** (on each vendor's detail page) — free, keyless outside-in
  recon: SPF/DMARC/DKIM/DNSSEC via Google's DNS-over-HTTPS, the vendor's own
  HTTPS response headers (HSTS/CSP/etc.), and subdomain enumeration via
  certificate transparency (crt.sh) — run server-side (Server Action), so
  unlike a pure-browser version it isn't blocked by CORS on crt.sh or the
  target's headers. Point-in-time snapshot, not continuous monitoring. Below
  that, one-click deep links into SSL Labs, Mozilla Observatory, Security
  Headers, MXToolbox, Shodan, Censys, urlscan.io, VirusTotal, HIBP, Google
  Safe Browsing, and DNSViz, plus a notes field to paste findings back. See
  `src/lib/osint/`.

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

## Useful commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | Lint |
| `npm run db:seed` | Seed the questionnaire template + sample data |
| `npm run db:reset` | Drop and recreate the local database |
| `npx prisma studio` | Browse/edit the SQLite database in a GUI |
