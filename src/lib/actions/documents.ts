"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export async function addVendorDocument(vendorId: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const url = normalizeUrl(String(formData.get("url") ?? ""));
  const notes = String(formData.get("notes") ?? "").trim();

  if (!title || !url) throw new Error("Title and URL are required");

  await prisma.vendorDocument.create({
    data: { vendorId, title, url, notes: notes || null },
  });

  revalidatePath(`/vendors/${vendorId}`);
  revalidatePath(`/vendors/${vendorId}/report`);
}

export async function deleteVendorDocument(documentId: string) {
  const doc = await prisma.vendorDocument.delete({ where: { id: documentId } });
  revalidatePath(`/vendors/${doc.vendorId}`);
  revalidatePath(`/vendors/${doc.vendorId}/report`);
}
