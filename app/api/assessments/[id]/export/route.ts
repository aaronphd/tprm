import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scoreAssessment, maturityLabel } from "@/lib/scoring";
import type { MaturityModel } from "@/lib/scoring";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function csvRow(values: (string | number)[]): string {
  return values.map((v) => csvEscape(String(v))).join(",") + "\r\n";
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      organization: true,
      framework: {
        include: {
          domains: {
            orderBy: { sortOrder: "asc" },
            include: { controls: { orderBy: { sortOrder: "asc" } } },
          },
        },
      },
      responses: { include: { evidence: true } },
    },
  });

  if (!assessment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const maturityModel = assessment.framework.maturityModel as unknown as MaturityModel;
  const score = scoreAssessment(assessment.framework.domains, assessment.responses, assessment.targetMaturity, maturityModel);

  let csv = csvRow(["Domain Code", "Domain Title", "Control Code", "Control Title", "Maturity", "Maturity Label", "Status", "Notes", "Evidence"]);
  for (const domain of score.domains) {
    for (const control of domain.controls) {
      csv += csvRow([
        domain.code,
        domain.title,
        control.code,
        control.title,
        control.maturity ?? "",
        maturityLabel(control.maturity, maturityModel.levels),
        control.status,
        control.notes ?? "",
        control.evidence.map((e) => `${e.title} (${e.url})`).join(" | "),
      ]);
    }
  }

  csv += "\r\n";
  csv += csvRow(["Overall readiness %", score.overallPercentage != null ? Math.round(score.overallPercentage) : ""]);
  csv += csvRow(["Readiness band", score.readinessBand ?? ""]);
  csv += csvRow(["Controls answered", `${score.answeredControls} / ${score.totalControls}`]);

  const filename = `${assessment.organization.name}-${assessment.framework.slug}-readiness.csv`.replace(/[^a-z0-9.-]+/gi, "_");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
