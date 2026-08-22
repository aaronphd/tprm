"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import type { ResponseStatus } from "@prisma/client";

export interface SaveResponseInput {
  assessmentId: string;
  controlId: string;
  maturity: number | null;
  status: ResponseStatus;
  notes: string | null;
}

export async function saveResponse(input: SaveResponseInput) {
  await prisma.response.upsert({
    where: {
      assessmentId_controlId: {
        assessmentId: input.assessmentId,
        controlId: input.controlId,
      },
    },
    update: {
      maturity: input.maturity,
      status: input.status,
      notes: input.notes,
    },
    create: {
      assessmentId: input.assessmentId,
      controlId: input.controlId,
      maturity: input.maturity,
      status: input.status,
      notes: input.notes,
    },
  });

  await prisma.assessment.updateMany({
    where: { id: input.assessmentId, status: "DRAFT" },
    data: { status: "IN_PROGRESS" },
  });

  revalidatePath(`/assessments/${input.assessmentId}`);
  revalidatePath(`/assessments/${input.assessmentId}/results`);
}
