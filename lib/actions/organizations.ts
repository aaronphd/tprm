"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function createOrganization(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Organization name is required");

  const industry = String(formData.get("industry") ?? "").trim() || null;
  const contactName = String(formData.get("contactName") ?? "").trim() || null;
  const contactEmail = String(formData.get("contactEmail") ?? "").trim() || null;

  const org = await prisma.organization.create({
    data: {
      name,
      industry,
      contactName,
      contactEmail,
      createdById: session.user.id,
    },
  });

  revalidatePath("/organizations");
  redirect(`/organizations/${org.id}`);
}
