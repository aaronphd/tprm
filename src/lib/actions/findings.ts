"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function optionalDate(value: FormDataEntryValue | null): Date | null {
  if (!value || typeof value !== "string" || value.trim() === "") return null;
  return new Date(value);
}

function optionalString(value: FormDataEntryValue | null): string | null {
  if (!value || typeof value !== "string" || value.trim() === "") return null;
  return value.trim();
}

export async function createFinding(formData: FormData) {
  const vendorId = String(formData.get("vendorId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!vendorId || !title) throw new Error("Vendor and title are required");

  const finding = await prisma.finding.create({
    data: {
      vendorId,
      title,
      description: optionalString(formData.get("description")),
      severity: String(formData.get("severity") ?? "MEDIUM"),
      status: String(formData.get("status") ?? "OPEN"),
      owner: optionalString(formData.get("owner")),
      dueDate: optionalDate(formData.get("dueDate")),
    },
  });

  revalidatePath(`/vendors/${vendorId}`);
  revalidatePath("/findings");
  redirect(`/findings/${finding.id}`);
}

export async function updateFinding(findingId: string, formData: FormData) {
  const existing = await prisma.finding.findUnique({ where: { id: findingId } });
  if (!existing) throw new Error("Finding not found");

  const status = String(formData.get("status") ?? existing.status);
  const wasResolved = existing.status === "RESOLVED";
  const nowResolved = status === "RESOLVED";

  await prisma.finding.update({
    where: { id: findingId },
    data: {
      title: String(formData.get("title") ?? existing.title).trim(),
      description: optionalString(formData.get("description")),
      severity: String(formData.get("severity") ?? existing.severity),
      status,
      owner: optionalString(formData.get("owner")),
      dueDate: optionalDate(formData.get("dueDate")),
      resolvedAt: nowResolved ? existing.resolvedAt ?? new Date() : wasResolved && !nowResolved ? null : existing.resolvedAt,
    },
  });

  revalidatePath(`/vendors/${existing.vendorId}`);
  revalidatePath(`/findings/${findingId}`);
  revalidatePath("/findings");
  redirect(`/findings/${findingId}`);
}

export async function deleteFinding(findingId: string) {
  const finding = await prisma.finding.delete({ where: { id: findingId } });
  revalidatePath(`/vendors/${finding.vendorId}`);
  revalidatePath("/findings");
  redirect("/findings");
}
