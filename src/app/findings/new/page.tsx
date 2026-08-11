import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createFinding } from "@/lib/actions/findings";
import { label, FINDING_SEVERITIES, FINDING_STATUSES } from "@/lib/types";
import { Card, PageHeader, buttonPrimary, buttonSecondary, inputClass, labelClass } from "@/components/ui";

export default async function NewFindingPage({
  searchParams,
}: {
  searchParams: Promise<{ vendorId?: string }>;
}) {
  const { vendorId } = await searchParams;
  const vendors = await prisma.vendor.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader title="New finding" description="Log a gap or remediation item for a vendor." />
      <Card className="max-w-2xl p-6">
        <form action={createFinding} className="space-y-4">
          <div>
            <label className={labelClass}>Vendor *</label>
            <select name="vendorId" required defaultValue={vendorId ?? ""} className={inputClass}>
              <option value="" disabled>
                Select a vendor
              </option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Title *</label>
            <input type="text" name="title" required className={inputClass} placeholder="e.g. No MFA on admin console" />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea name="description" rows={3} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Severity</label>
              <select name="severity" defaultValue="MEDIUM" className={inputClass}>
                {FINDING_SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {label(s)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select name="status" defaultValue="OPEN" className={inputClass}>
                {FINDING_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {label(s)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Owner</label>
              <input type="text" name="owner" className={inputClass} placeholder="Who is remediating this?" />
            </div>
            <div>
              <label className={labelClass}>Due date</label>
              <input type="date" name="dueDate" className={inputClass} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className={buttonPrimary}>
              Create finding
            </button>
            <Link href={vendorId ? `/vendors/${vendorId}` : "/findings"} className={buttonSecondary}>
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
