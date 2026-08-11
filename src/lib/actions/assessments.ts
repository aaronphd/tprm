"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isRiskyAnswer, scoreFromResponses } from "@/lib/risk";

export async function createAssessment(formData: FormData) {
  const vendorId = String(formData.get("vendorId") ?? "");
  const templateId = String(formData.get("templateId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const dueAtRaw = formData.get("dueAt");

  if (!vendorId || !templateId || !title) {
    throw new Error("Vendor, template, and title are required");
  }

  const template = await prisma.questionnaireTemplate.findUnique({
    where: { id: templateId },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!template) throw new Error("Template not found");

  const assessment = await prisma.assessment.create({
    data: {
      vendorId,
      templateId,
      title,
      status: "DRAFT",
      dueAt: dueAtRaw && typeof dueAtRaw === "string" && dueAtRaw ? new Date(dueAtRaw) : null,
      responses: {
        create: template.questions.map((q) => ({
          questionTemplateId: q.id,
          category: q.category,
          text: q.text,
          weight: q.weight,
          answer: "UNANSWERED",
          riskFlag: false,
        })),
      },
    },
  });

  revalidatePath(`/vendors/${vendorId}`);
  revalidatePath("/assessments");
  redirect(`/assessments/${assessment.id}`);
}

export async function markAssessmentSent(assessmentId: string) {
  const assessment = await prisma.assessment.update({
    where: { id: assessmentId },
    data: { status: "SENT", sentAt: new Date() },
  });
  revalidatePath(`/assessments/${assessmentId}`);
  revalidatePath(`/vendors/${assessment.vendorId}`);
}

export async function saveAssessmentResponses(assessmentId: string, formData: FormData) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      responses: { include: { questionTemplate: true } },
    },
  });
  if (!assessment) throw new Error("Assessment not found");

  const complete = formData.get("_complete") === "1";

  const updated = await Promise.all(
    assessment.responses.map(async (r) => {
      const answer = String(formData.get(`answer_${r.id}`) ?? r.answer);
      const notes = formData.get(`notes_${r.id}`);
      const riskFlag = isRiskyAnswer(answer, r.questionTemplate.riskyAnswer);
      return prisma.response.update({
        where: { id: r.id },
        data: {
          answer,
          riskFlag,
          notes: typeof notes === "string" && notes.trim() !== "" ? notes.trim() : null,
        },
      });
    })
  );

  const score = scoreFromResponses(updated);
  const anyAnswered = updated.some((r) => r.answer !== "UNANSWERED");
  const allAnswered = updated.every((r) => r.answer !== "UNANSWERED");

  let status = assessment.status;
  let completedAt = assessment.completedAt;
  if (complete && allAnswered) {
    status = "COMPLETED";
    completedAt = new Date();
  } else if (anyAnswered) {
    status = assessment.status === "DRAFT" ? "IN_PROGRESS" : assessment.status === "SENT" ? "IN_PROGRESS" : assessment.status;
  }

  await prisma.assessment.update({
    where: { id: assessmentId },
    data: { score, status, completedAt },
  });

  revalidatePath(`/assessments/${assessmentId}`);
  revalidatePath(`/vendors/${assessment.vendorId}`);
  redirect(`/assessments/${assessmentId}`);
}

export async function generateFindingsFromRiskyResponses(assessmentId: string) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      responses: { where: { riskFlag: true }, include: { findings: true } },
    },
  });
  if (!assessment) throw new Error("Assessment not found");

  const severityFromWeight = (weight: number) =>
    weight >= 3 ? "HIGH" : weight === 2 ? "MEDIUM" : "LOW";

  const toCreate = assessment.responses.filter((r) => r.findings.length === 0);

  await prisma.finding.createMany({
    data: toCreate.map((r) => ({
      vendorId: assessment.vendorId,
      assessmentId: assessment.id,
      responseId: r.id,
      title: r.text,
      description: `Flagged from assessment response in category "${r.category}".`,
      severity: severityFromWeight(r.weight),
      status: "OPEN",
    })),
  });

  revalidatePath(`/assessments/${assessmentId}`);
  revalidatePath(`/vendors/${assessment.vendorId}`);
  revalidatePath("/findings");
}

export async function deleteAssessment(assessmentId: string) {
  const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
  if (!assessment) return;
  await prisma.assessment.delete({ where: { id: assessmentId } });
  revalidatePath(`/vendors/${assessment.vendorId}`);
  revalidatePath("/assessments");
  redirect(`/vendors/${assessment.vendorId}`);
}
