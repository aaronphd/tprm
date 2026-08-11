"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { scanDomain } from "@/lib/osint/lookups";

export async function runOsintScan(vendorId: string, formData: FormData) {
  const domain = String(formData.get("domain") ?? "").trim();
  if (!domain) throw new Error("Enter a domain to scan.");

  const result = await scanDomain(domain);

  await prisma.osintScan.create({
    data: {
      vendorId,
      domain: result.domain,
      resultJson: JSON.stringify(result),
    },
  });

  revalidatePath(`/vendors/${vendorId}`);
}

export async function saveOsintNotes(scanId: string, formData: FormData) {
  const scan = await prisma.osintScan.findUnique({ where: { id: scanId } });
  if (!scan) throw new Error("Scan not found");

  const manualNotes = String(formData.get("manualNotes") ?? "").trim();

  await prisma.osintScan.update({
    where: { id: scanId },
    data: { manualNotes: manualNotes || null },
  });

  revalidatePath(`/vendors/${scan.vendorId}`);
}

export async function deleteOsintScan(scanId: string) {
  const scan = await prisma.osintScan.delete({ where: { id: scanId } });
  revalidatePath(`/vendors/${scan.vendorId}`);
}
