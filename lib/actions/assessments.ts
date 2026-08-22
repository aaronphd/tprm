"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function createAssessment(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const organizationId = String(formData.get("organizationId") ?? "");
  const frameworkId = String(formData.get("frameworkId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!organizationId || !frameworkId || !name) {
    throw new Error("Organization, framework, and name are required");
  }

  const assessment = await prisma.assessment.create({
    data: {
      organizationId,
      frameworkId,
      name,
      createdById: session.user.id,
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
