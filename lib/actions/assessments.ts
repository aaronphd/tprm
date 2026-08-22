"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { MaturityModel } from "@/lib/scoring";

export async function createAssessment(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const organizationId = String(formData.get("organizationId") ?? "");
  const frameworkId = String(formData.get("frameworkId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!organizationId || !frameworkId || !name) {
    throw new Error("Organization, framework, and name are required");
  }

  const framework = await prisma.framework.findUniqueOrThrow({ where: { id: frameworkId } });
  const maturityModel = framework.maturityModel as unknown as MaturityModel;
  const levels = [...maturityModel.levels].sort((a, b) => a.value - b.value);
  // Default target: the level at the midpoint of the framework's own scale
  // (e.g. "Defined" on the default 0-5 CMMI-style scale), not a fixed literal
  // -- frameworks with a different maturity model get a sensible target too.
  const defaultTargetMaturity = levels[Math.floor(levels.length / 2)]?.value ?? 0;

  const assessment = await prisma.assessment.create({
    data: {
      organizationId,
      frameworkId,
      name,
      createdById: session.user.id,
      targetMaturity: defaultTargetMaturity,
    },
  });

  revalidatePath(`/organizations/${organizationId}`);
  redirect(`/assessments/${assessment.id}`);
}

export async function completeAssessment(assessmentId: string) {
  await prisma.assessment.update({
    where: { id: assessmentId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  revalidatePath(`/assessments/${assessmentId}`);
  redirect(`/assessments/${assessmentId}/results`);
}

export async function reopenAssessment(assessmentId: string) {
  await prisma.assessment.update({
    where: { id: assessmentId },
    data: { status: "IN_PROGRESS", completedAt: null },
  });

  revalidatePath(`/assessments/${assessmentId}`);
  redirect(`/assessments/${assessmentId}`);
}
