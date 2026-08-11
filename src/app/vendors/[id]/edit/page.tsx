import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateVendor } from "@/lib/actions/vendors";
import { VendorForm } from "@/components/VendorForm";
import { Card, PageHeader } from "@/components/ui";

export default async function EditVendorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor) notFound();

  const action = updateVendor.bind(null, id);

  return (
    <div>
      <PageHeader title={`Edit ${vendor.name}`} />
      <Card className="max-w-3xl p-6">
        <VendorForm vendor={vendor} action={action} cancelHref={`/vendors/${id}`} />
      </Card>
    </div>
  );
}
