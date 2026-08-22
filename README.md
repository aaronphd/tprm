# Risk Readiness Assessment

A RealCiso-style readiness assessment app: run maturity-based assessments against
control frameworks for client organizations, see a scored dashboard with gaps, and
export results.

Built with Next.js (App Router), TypeScript, Tailwind CSS, Prisma (SQLite), and
Auth.js (NextAuth) credentials auth.

Frameworks included out of the box: **ISO/IEC 27001:2022** (93 Annex A controls),
**ISO/IEC 42001:2023** (AI management system controls), and **SOC 2** (AICPA Trust
Services Criteria). See "Adding a framework" below to add more.

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
  Implemented / Partial / Implemented / Not Applicable) and, for applicable
  controls, a 0–5 maturity rating (Not Implemented → Ad Hoc → Repeatable →
  Defined → Managed → Optimized), plus optional notes/evidence. Every change
  autosaves.
- **Results** (`/assessments/[id]/results`) — overall readiness percentage and
  band (Initial/Developing/Defined/Managed/Optimized), a readiness-by-domain
  breakdown, and a gap list of every control scoring below the assessment's
  target maturity (default: 3 · Defined). Export the full scored assessment as
  CSV from here.
- **Dashboard** (`/`) — organization and assessment counts, recent assessments
  across all clients.

Scoring lives in `lib/scoring.ts`: a control's score is its maturity rating
(controls marked Not Applicable are excluded from every average); a domain's
score is the average maturity of its applicable controls; the overall readiness
score is the average across all applicable controls in the assessment.

## Adding a framework

Frameworks, domains, and controls are pure data — no code changes needed to add
one:

1. Add a new file under `prisma/data/` shaped like `prisma/data/soc2.ts` (a
   `FrameworkSeed`: slug, name, version, description, and a list of domains each
   with a list of controls).
2. Import it and add a `seedFramework(...)` call in `prisma/seed.ts`.
3. Run `npm run db:seed` again — it's an upsert, safe to re-run.

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

## Scope notes

- Single flat `User` model, no roles/permissions yet — every logged-in user has
  full access. Add role-based access if/when it's actually needed.
- Reporting in v1 is the in-app results dashboard plus CSV export. Polished
  PDF/Word report generation is intentionally out of scope for now.
