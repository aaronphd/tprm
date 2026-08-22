import Link from "next/link";
import { prisma } from "@/lib/db";
import { createOrganization } from "@/lib/actions/organizations";

export default async function OrganizationsPage() {
  const organizations = await prisma.organization.findMany({
    include: { _count: { select: { assessments: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Organizations</h1>
        <p className="text-sm text-slate-500">Client organizations you run readiness assessments for.</p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">New organization</h2>
        <form action={createOrganization} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name" name="name" required />
          <Field label="Industry" name="industry" />
          <Field label="Primary contact name" name="contactName" />
          <Field label="Primary contact email" name="contactEmail" type="email" />
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Create organization
            </button>
          </div>
        </form>
      </div>

      {organizations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No organizations yet. Create one above to start an assessment.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Industry</th>
                <th className="px-4 py-2 font-medium">Contact</th>
                <th className="px-4 py-2 font-medium">Assessments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {organizations.map((org) => (
                <tr key={org.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5">
                    <Link href={`/organizations/${org.id}`} className="font-medium text-slate-900 hover:text-indigo-600">
                      {org.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{org.industry ?? "—"}</td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {org.contactName ?? org.contactEmail ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{org._count.assessments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
    </div>
  );
}
