import { createVendor } from "@/lib/actions/vendors";
import { VendorForm } from "@/components/VendorForm";
import { Card, PageHeader } from "@/components/ui";

export default function NewVendorPage() {
  return (
    <div>
      <PageHeader title="Add vendor" description="Register a new third party in the inventory." />
      <Card className="max-w-3xl p-6">
        <VendorForm action={createVendor} cancelHref="/vendors" />
      </Card>
    </div>
  );
}
