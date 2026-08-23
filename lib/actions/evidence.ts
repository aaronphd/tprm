"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export interface AddEvidenceInput {
  assessmentId: string;
  controlId: string;
  title: string;
  url: string;
  note: string | null;
}

function revalidateAssessment(assessmentId: string) {
  revalidatePath(`/assessments/${assessmentId}`);
  revalidatePath(`/assessments/${assessmentId}/results`);
}

export async function addEvidence(input: AddEvidenceInput) {
  const title = input.title.trim();
  const url = input.url.trim();
  if (!title) throw new Error("Evidence title is required");
  try {
    new URL(url);
  } catch {
    throw new Error("Evidence URL must be a valid, fully-qualified URL");
  }

  // Evidence can be attached before any maturity/status has been recorded --
  // make sure the Response row exists (same upsert pattern as saveResponse).
  const response = await prisma.response.upsert({
    where: {
      assessmentId_controlId: {
        assessmentId: input.assessmentId,
        controlId: input.controlId,
      },
    },
    update: {},
    create: {
      assessmentId: input.assessmentId,
      controlId: input.controlId,
    },
  });

  const evidence = await prisma.evidence.create({
    data: {
      responseId: response.id,
      title,
      url,
      note: input.note?.trim() || null,
    },
  });

  await prisma.assessment.updateMany({
    where: { id: input.assessmentId, status: "DRAFT" },
    data: { status: "IN_PROGRESS" },
  });

  revalidateAssessment(input.assessmentId);

  return evidence;
}

export async function deleteEvidence(evidenceId: string, assessmentId: string) {
  await prisma.evidence.delete({ where: { id: evidenceId } });
  revalidateAssessment(assessmentId);
}
