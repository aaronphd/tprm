# Risk Readiness Assessment

A RealCiso-style readiness assessment app: run maturity-based assessments against
control frameworks for client organizations, see a scored dashboard with gaps, and
export results.

Built with Next.js (App Router), TypeScript, Tailwind CSS, Prisma (SQLite), and
Auth.js (NextAuth) credentials auth.

Frameworks included out of the box: **ISO/IEC 27001:2022** (93 Annex A controls),
**ISO/IEC 42001:2023** (AI management system controls), **SOC 2** (AICPA Trust
Services Criteria), **CJIS Security Policy v6.1** (20 policy areas), and
**NIST CSF 2.0** (6 functions, 22 categories). See "Adding a framework" below
to add more.

## Getting started

```bash
npm install
cp .env.example .env   # sets DATABASE_URL, AUTH_SECRET, seed admin credentials
npx prisma db push     # first run only: creates prisma/dev.db from the schema
npm run db:seed        # seeds the frameworks/controls and an admin user
npm run dev
```

Open http://localhost:3000 and sign in with the `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD` from `.env` (defaults to `admin@example.com` /
`changeme123!` if unset). Change the password after first login by re-seeding
with a new `SEED_ADMIN_PASSWORD`, or by editing the user directly — there's no
in-app password change flow in v1.

On later runs, once `.env` and `prisma/dev.db` already exist, `npm run dev` alone
is enough.

## What's here

- **Organizations** (`/organizations`) — client organizations you run assessments
  for.
- **Assessments** (`/organizations/[id]`, `/assessments/[id]`) — pick a framework,
  start an assessment, then work through every control: a status (Not
  Implemented / Partial / Implemented / Not Applicable), for applicable
  controls a maturity rating on that framework's own maturity model, a free-text
  notes field, and evidence links (see "Evidence" below). Every change autosaves.
- **Results** (`/assessments/[id]/results`) — overall readiness percentage and
  band (Initial/Developing/Defined/Managed/Optimized), a readiness-by-domain
  breakdown, and a gap list of every control scoring below the assessment's
  target maturity. Export the full scored assessment as CSV from here.
- **Dashboard** (`/`) — organization and assessment counts, recent assessments
  across all clients.

Scoring lives in `lib/scoring.ts`: a control's score is its maturity rating
(controls marked Not Applicable are excluded from every average); a domain's
score is the average maturity of its applicable controls; the overall readiness
score is the average across all applicable controls, expressed as a percentage
of the framework's own maturity model maximum (see "Maturity models" below).

## Adding a framework

Frameworks, domains, and controls are pure data — no code changes needed to add
one:

1. Add a new file under `prisma/data/` shaped like `prisma/data/soc2.ts` (a
   `FrameworkSeed`: slug, name, version, description, a `maturityModel`, and a
   list of domains each with a list of controls).
2. Import it and add a `seedFramework(...)` call in `prisma/seed.ts`.
3. Run `npm run db:seed` again — it's an upsert, safe to re-run.

## Maturity models

Each framework carries its own `maturityModel` (a name plus an ordered list of
`{ value, label }` levels, starting at 0) rather than a single global scale —
stored on the `Framework` row and read by the scoring engine, the assessment
workspace, results page, and CSV export alike. All five frameworks currently
in the app share the same one, `CMMI_STYLE_MATURITY` in
`prisma/data/maturity-models.ts` (Not Implemented → Ad Hoc → Repeatable →
Defined → Managed → Optimized, 0–5), imported by each framework's data file —
but a new framework can define a different model (different levels, different
count, different labels) and everything downstream — the maturity buttons in
the workspace, the readiness percentage, the default target maturity, the gap
list, the CSV — adapts automatically. `readinessBand()` (Initial/Developing/
Defined/Managed/Optimized) stays model-agnostic since it operates on the
resulting 0–100% score, not the raw scale.

A new assessment's default target maturity is computed from its framework's
own model (the level at the midpoint of the scale — e.g. "Defined" on the
default 0–5 model), not a hardcoded literal — see `createAssessment` in
`lib/actions/assessments.ts`.

## Evidence

Each control can carry any number of evidence links — a title, a URL, and an
optional note (`Evidence`, one-to-many off `Response`). This app stores the
link, not the file: evidence lives wherever it already does (SharePoint,
Drive, a signed policy doc, a screenshot host) and this just keeps a
pointer to it per control, same pattern as the "Documents & Evidence" feature
on the sibling vendor-TPRM app in this repo. Add/remove evidence from the
control row in the assessment workspace (`components/EvidenceList.tsx`,
`lib/actions/evidence.ts`); it shows up on the gap list on the results page
and in the CSV export (an `Evidence` column, `title (url)` pairs). Attaching
evidence to a control that has no status/maturity recorded yet still works —
it creates the underlying `Response` row on demand, same as answering the
control would.

There's no file upload or storage in the app itself — if you need evidence to
live inside the app rather than linked from elsewhere, that's a heavier
follow-up (file storage, upload/download routes, size/type limits), not
covered here.

## Notes on the seeded control data

- **ISO/IEC 27001:2022** domain/control numbering and titles follow the official
  Annex A structure (4 themes, 93 controls). Descriptions are paraphrased for
  assessment purposes, not verbatim standard text.
- **SOC 2** is seeded from the firm's own Trust Services Criteria reference
  (CC1–CC9 plus the optional Availability, Confidentiality, and Privacy
  categories). Mark a category's controls Not Applicable if it's out of scope
  for a given engagement.
- **ISO/IEC 42001:2023** is built from general knowledge of the standard's Annex
  A structure rather than a verified reference, and hasn't been checked
  control-by-control against the licensed text — treat it as a reasonable
  starting point, not a certified mapping. Validate before using it for formal
  certification prep.
- **CJIS Security Policy** domain structure (the 20 policy areas: Information
  Exchange Agreements, the 18 NIST SP 800-53 control families, Mobile Devices)
  was verified via web search against current FBI CJIS publications as of
  v6.1 (June 2026). The controls within each policy area are a representative
  set built from general CJIS-specific knowledge, not a line-by-line reading
  of the licensed policy text. Note: FBI CJIS audits through 2027-03-31 are
  still conducted against the prior v5.9.5 — confirm which version your CSA
  is auditing against before scoping an engagement.
- **NIST CSF 2.0** function/category structure (6 functions, 22 categories) was
  verified via web search against NIST's published CSF 2.0 Core (Feb 2024) —
  this corrected a stale category count (29, not 22) in the firm's own
  control-mapping-engine skill notes. The controls within each category are a
  representative set drawn from the framework's ~106 published subcategories,
  not a verified line-by-line reproduction — validate against the official
  NIST CSF 2.0 Core before formal use.

## Scope notes

- Single flat `User` model, no roles/permissions yet — every logged-in user has
  full access. Add role-based access if/when it's actually needed.
- Reporting in v1 is the in-app results dashboard plus CSV export. Polished
  PDF/Word report generation is intentionally out of scope for now.
