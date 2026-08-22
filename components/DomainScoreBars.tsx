import type { ScoredDomain } from "@/lib/scoring";

const FILL = "#2a78d6";
const TRACK = "#e1e0d9";

export function DomainScoreBars({ domains }: { domains: ScoredDomain[] }) {
  return (
    <div className="space-y-4">
      {domains.map((domain) => (
        <div key={domain.id}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
            <span className="font-medium text-slate-700">
              {domain.code} &middot; {domain.title}
            </span>
            <span className="shrink-0 text-slate-500">
              {domain.percentage != null ? `${Math.round(domain.percentage)}%` : "No data"}
              <span className="ml-2 text-xs text-slate-400">
                ({domain.answeredCount}/{domain.applicableCount} answered)
              </span>
            </span>
          </div>
          <div
            className="h-4 w-full overflow-hidden rounded-[4px]"
            style={{ backgroundColor: TRACK }}
            role="img"
            aria-label={`${domain.title}: ${domain.percentage != null ? Math.round(domain.percentage) + "%" : "no data"}`}
          >
            <div
              className="h-full rounded-[4px]"
              style={{
                width: `${domain.percentage ?? 0}%`,
                backgroundColor: FILL,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
