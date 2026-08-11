import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { label, RISK_TIERS, VENDOR_STATUSES } from "@/lib/types";
import { TIER_BADGE, TIER_ORDER, VENDOR_STATUS_BADGE } from "@/lib/risk";
import { Badge, buttonPrimary, Card, EmptyState, PageHeader } from "@/components/ui";

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tier?: string; status?: string }>;
}) {
  const { q, tier, status } = await searchParams;

  const vendors = await prisma.vendor.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { name: { contains: q } },
                { category: { contains: q } },
              ],
            }
          : {},
        tier ? { riskTier: tier } : {},
        status ? { status } : {},
      ],
    },
    include: {
      _count: {
        select: { findings: { where: { status: { in: ["OPEN", "IN_PROGRESS"] } } } },
      },
    },
    orderBy: [{ name: "asc" }],
  });

  vendors.sort((a, b) => TIER_ORDER[a.riskTier] - TIER_ORDER[b.riskTier]);

  return (
    <div>
      <PageHeader
        title="Vendors"
        description="Third-party inventory, risk tiering, and ownership."
        action={
          <Link href="/vendors/new" className={buttonPrimary}>
            Add vendor
          </Link>
        }
      />

      <Card className="mb-4 p-4">
        <form className="flex flex-wrap items-end gap-3" method="get">
          <div className="flex-1 min-w-[180px]">
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Search
            </label>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Name or category"
              className="block w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Risk tier
            </label>
            <select
              name="tier"
              defaultValue={tier ?? ""}
              className="block rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="">All</option>
              {RISK_TIERS.map((t) => (
                <option key={t} value={t}>
                  {label(t)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Status
            </label>
            <select
              name="status"
              defaultValue={status ?? ""}
              className="block rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="">All</option>
              {VENDOR_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="rounded-md border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            Filter
          </button>
          {(q || tier || status) && (
            <Link href="/vendors" className="text-sm text-slate-500 underline underline-offset-2">
              Clear
            </Link>
          )}
        </form>
      </Card>

      {vendors.length === 0 ? (
        <EmptyState
          title="No vendors found"
          description="Add your first third party to start tracking risk."
          action={
            <Link href="/vendors/new" className={buttonPrimary}>
              Add vendor
            </Link>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Vendor</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Category</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Risk tier</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Owner</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Open findings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm">
                    <Link href={`/vendors/${v.id}`} className="font-medium text-slate-900 hover:underline">
                      {v.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{v.category ?? "—"}</td>
                  <td className="px-4 py-3 text-sm">
                    <Badge className={TIER_BADGE[v.riskTier]}>{label(v.riskTier)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge className={VENDOR_STATUS_BADGE[v.status]}>{label(v.status)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{v.ownerName ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {v._count.findings > 0 ? (
                      <span className="font-medium text-red-600">{v._count.findings}</span>
                    ) : (
                      "0"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
