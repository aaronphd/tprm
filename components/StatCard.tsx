import Link from "next/link";

export function StatCard({ label, value, href }: { label: string; value: number | string; href?: string }) {
  const content = (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block transition hover:border-slate-300 hover:shadow-sm">
        {content}
      </Link>
    );
  }

  return content;
}
