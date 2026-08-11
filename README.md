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

## Data model

See `prisma/schema.prisma`. SQLite has no native enum type, so status/tier/
severity fields are plain strings constrained by the TypeScript literal
types in `src/lib/types.ts`.

The default questionnaire template (`prisma/seed.ts`) covers six domains:
data security, access control, incident response, business continuity,
compliance & legal, and subprocessor/fourth-party risk. Edit
`prisma/seed.ts` and re-run `npm run db:seed` to change it, or add more
templates directly via Prisma Studio (`npx prisma studio`).

## Useful commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | Lint |
| `npm run db:seed` | Seed the questionnaire template + sample data |
| `npm run db:reset` | Drop and recreate the local database |
| `npx prisma studio` | Browse/edit the SQLite database in a GUI |
