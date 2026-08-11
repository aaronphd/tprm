import { prisma } from "@/lib/prisma";
import { createAssessment } from "@/lib/actions/assessments";
import { Card, PageHeader, buttonPrimary, buttonSecondary, inputClass, labelClass } from "@/components/ui";
import Link from "next/link";

export default async function NewAssessmentPage({
  searchParams,
}: {
  searchParams: Promise<{ vendorId?: string }>;
}) {
  const { vendorId } = await searchParams;

  const [vendors, templates] = await Promise.all([
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
    prisma.questionnaireTemplate.findMany({ orderBy: { name: "asc" } }),
  ]);

  const defaultTemplate = templates[0];

  return (
    <div>
      <PageHeader title="New assessment" description="Assign a security questionnaire to a vendor." />
      <Card className="max-w-2xl p-6">
        <form action={createAssessment} className="space-y-4">
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
            <label className={labelClass}>Questionnaire template *</label>
            <select name="templateId" required defaultValue={defaultTemplate?.id} className={inputClass}>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Title *</label>
            <input
              type="text"
              name="title"
              required
              defaultValue={defaultTemplate ? `${defaultTemplate.name} — ${new Date().getFullYear()}` : ""}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Due date</label>
            <input type="date" name="dueAt" className={inputClass} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className={buttonPrimary}>
              Create assessment
            </button>
            <Link href={vendorId ? `/vendors/${vendorId}` : "/assessments"} className={buttonSecondary}>
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
