import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { createAssessment } from "@/lib/actions/assessments";
import { StatusBadge } from "@/components/StatusBadge";

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;

  const [organization, frameworks] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      include: { assessments: { include: { framework: true }, orderBy: { createdAt: "desc" } } },
    }),
    prisma.framework.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!organization) notFound();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-slate-500">
          <Link href="/organizations" className="hover:text-indigo-600">
            Organizations
          </Link>{" "}
          / {organization.name}
        </p>
        <h1 className="text-xl font-semibold text-slate-900">{organization.name}</h1>
        <p className="text-sm text-slate-500">
          {organization.industry ?? "No industry set"}
          {organization.contactName ? ` · ${organization.contactName}` : ""}
          {organization.contactEmail ? ` · ${organization.contactEmail}` : ""}
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Start a new assessment</h2>
        <form action={createAssessment} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <input type="hidden" name="organizationId" value={organization.id} />
          <div>
            <label htmlFor="frameworkId" className="mb-1 block text-sm font-medium text-slate-700">
              Framework
            </label>
            <select
              id="frameworkId"
              name="frameworkId"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {frameworks.map((fw) => (
                <option key={fw.id} value={fw.id}>
                  {fw.name} ({fw.version})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
              Assessment name
            </label>
            <input
              id="name"
              name="name"
              required
              defaultValue={`${organization.name} Readiness Assessment`}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Start assessment
            </button>
          </div>
        </form>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Assessments</h2>
        {organization.assessments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No assessments yet for this organization.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Framework</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {organization.assessments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <Link
                        href={a.status === "COMPLETED" ? `/assessments/${a.id}/results` : `/assessments/${a.id}`}
                        className="font-medium text-slate-900 hover:text-indigo-600"
                      >
                        {a.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{a.framework.name}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {a.createdAt.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
