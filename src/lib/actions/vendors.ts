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

function vendorDataFromForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    description: optionalString(formData.get("description")),
    website: optionalString(formData.get("website")),
    category: optionalString(formData.get("category")),
    riskTier: String(formData.get("riskTier") ?? "MEDIUM"),
    status: String(formData.get("status") ?? "PROSPECTIVE"),
    ownerName: optionalString(formData.get("ownerName")),
    contactName: optionalString(formData.get("contactName")),
    contactEmail: optionalString(formData.get("contactEmail")),
    contractStart: optionalDate(formData.get("contractStart")),
    contractEnd: optionalDate(formData.get("contractEnd")),
    notes: optionalString(formData.get("notes")),
  };
}

export async function createVendor(formData: FormData) {
  const data = vendorDataFromForm(formData);
  if (!data.name) throw new Error("Vendor name is required");

  const vendor = await prisma.vendor.create({ data });
  revalidatePath("/vendors");
  redirect(`/vendors/${vendor.id}`);
}

export async function updateVendor(vendorId: string, formData: FormData) {
  const data = vendorDataFromForm(formData);
  if (!data.name) throw new Error("Vendor name is required");

  await prisma.vendor.update({ where: { id: vendorId }, data });
  revalidatePath("/vendors");
  revalidatePath(`/vendors/${vendorId}`);
  redirect(`/vendors/${vendorId}`);
}

export async function deleteVendor(vendorId: string) {
  await prisma.vendor.delete({ where: { id: vendorId } });
  revalidatePath("/vendors");
  redirect("/vendors");
}
