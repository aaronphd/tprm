import Link from "next/link";
import { prisma } from "@/lib/db";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";

export default async function DashboardPage() {
  const [orgCount, assessments] = await Promise.all([
    prisma.organization.count(),
    prisma.assessment.findMany({
      include: { organization: true, framework: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const inProgress = assessments.filter((a) => a.status === "IN_PROGRESS").length;
  const completed = assessments.filter((a) => a.status === "COMPLETED").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Overview of client organizations and readiness assessments.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Organizations" value={orgCount} href="/organizations" />
        <StatCard label="Assessments in progress" value={inProgress} />
        <StatCard label="Completed assessments" value={completed} />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Recent assessments</h2>
          <Link href="/organizations" className="text-sm text-indigo-600 hover:text-indigo-500">
            View organizations &rarr;
          </Link>
        </div>

        {assessments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No assessments yet.{" "}
            <Link href="/organizations" className="text-indigo-600 hover:text-indigo-500">
              Create an organization
            </Link>{" "}
            to get started.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Assessment</th>
                  <th className="px-4 py-2 font-medium">Organization</th>
                  <th className="px-4 py-2 font-medium">Framework</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assessments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <Link href={`/assessments/${a.id}`} className="font-medium text-slate-900 hover:text-indigo-600">
                        {a.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      <Link href={`/organizations/${a.organizationId}`} className="hover:text-indigo-600">
                        {a.organization.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{a.framework.name}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={a.status} />
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
