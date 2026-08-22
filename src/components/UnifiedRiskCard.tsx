import { computeUnifiedRisk } from "@/lib/unifiedRisk";
import { DATA_CATEGORY_LABELS, label, parseDataCategories } from "@/lib/types";
import { TIER_BADGE } from "@/lib/risk";
import type { OsintResult } from "@/lib/osint/types";
import { formatDate } from "@/lib/format";
import { Badge, Card } from "@/components/ui";

export function UnifiedRiskCard({
  dataCategoriesJson,
  completedScores,
  latestOsintResult,
  latestOsintScannedAt,
}: {
  dataCategoriesJson: string | null;
  completedScores: number[];
  latestOsintResult: OsintResult | null;
  latestOsintScannedAt: Date | null;
}) {
  const dataCategories = parseDataCategories(dataCategoriesJson);
  const risk = computeUnifiedRisk({ dataCategories, completedScores, latestOsintResult });

  return (
    <Card className="p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Unified Risk Score</h2>
        <Badge className={TIER_BADGE[risk.tier]}>{label(risk.tier)}</Badge>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Computed from data sensitivity, assessment history, and the latest OSINT scan.
        Informational only — separate from the risk tier assigned above.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-lg font-semibold text-slate-900">{risk.inherent}</p>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Inherent</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-900">{risk.control ?? "—"}</p>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Control</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-900">{risk.residual}</p>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Residual</p>
        </div>
      </div>

      {dataCategories.length === 0 ? (
        <p className="mt-4 text-xs text-slate-400">
          No data-sensitivity categories set — edit the vendor to classify what data it accesses.
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-1">
          {dataCategories.map((c) => (
            <Badge key={c} className="bg-slate-100 text-slate-700 ring-slate-500/20">
              {DATA_CATEGORY_LABELS[c]}
            </Badge>
          ))}
        </div>
      )}

      {risk.control === null ? (
        <p className="mt-3 text-xs text-slate-400">
          Not yet assessed — full inherent risk carries through until a completed assessment
          provides evidence of controls.
        </p>
      ) : null}

      {risk.signalReasons.length > 0 ? (
        <details className="mt-3 text-xs text-slate-500">
          <summary className="cursor-pointer hover:text-slate-700">
            Residual signal boosts ({risk.signalReasons.length}
            {latestOsintScannedAt ? `, from OSINT scan ${formatDate(latestOsintScannedAt)}` : ""})
          </summary>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {risk.signalReasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </details>
      ) : latestOsintResult ? (
        <p className="mt-3 text-xs text-slate-400">
          No residual risk signals flagged from the latest OSINT scan.
        </p>
      ) : (
        <p className="mt-3 text-xs text-slate-400">No OSINT scan run yet — residual signals not included.</p>
      )}
    </Card>
  );
}
