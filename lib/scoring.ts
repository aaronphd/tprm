import type { Control, Domain, Evidence, Response, ResponseStatus } from "@prisma/client";
import type { MaturityLevel, MaturityModel } from "@/prisma/data/types";

export type { MaturityLevel, MaturityModel };

export function maturityLabel(value: number | null | undefined, levels: MaturityLevel[]): string {
  if (value == null) return "Not answered";
  return levels.find((l) => l.value === value)?.label ?? "Unknown";
}

export function maxMaturityValue(maturityModel: MaturityModel): number {
  return Math.max(...maturityModel.levels.map((l) => l.value));
}

export function readinessBand(percentage: number): string {
  if (percentage <= 20) return "Initial";
  if (percentage <= 40) return "Developing";
  if (percentage <= 60) return "Defined";
  if (percentage <= 80) return "Managed";
  return "Optimized";
}

type DomainWithControls = Domain & { controls: Control[] };
type ResponseWithEvidence = Response & { evidence: Evidence[] };

export interface ScoredControl extends Control {
  maturity: number | null;
  status: ResponseStatus;
  notes: string | null;
  evidence: Evidence[];
}

export interface ScoredDomain {
  id: string;
  code: string;
  title: string;
  controls: ScoredControl[];
  averageMaturity: number | null;
  percentage: number | null;
  applicableCount: number;
  answeredCount: number;
}

export interface Gap {
  domainCode: string;
  domainTitle: string;
  control: ScoredControl;
}

export interface AssessmentScore {
  domains: ScoredDomain[];
  overallAverageMaturity: number | null;
  overallPercentage: number | null;
  readinessBand: string | null;
  totalControls: number;
  applicableControls: number;
  answeredControls: number;
  gaps: Gap[];
}

const DEFAULT_STATUS: ResponseStatus = "NOT_IMPLEMENTED";

export function scoreAssessment(
  domains: DomainWithControls[],
  responses: ResponseWithEvidence[],
  targetMaturity: number,
  maturityModel: MaturityModel,
): AssessmentScore {
  const maxMaturity = maxMaturityValue(maturityModel);
  const responseByControlId = new Map(responses.map((r) => [r.controlId, r]));

  const scoredDomains: ScoredDomain[] = domains.map((domain) => {
    const controls: ScoredControl[] = domain.controls.map((control) => {
      const response = responseByControlId.get(control.id);
      return {
        ...control,
        maturity: response?.maturity ?? null,
        status: response?.status ?? DEFAULT_STATUS,
        notes: response?.notes ?? null,
        evidence: response?.evidence ?? [],
      };
    });

    const applicable = controls.filter((c) => c.status !== "NOT_APPLICABLE");
    const answered = applicable.filter((c) => c.maturity != null);
    const averageMaturity =
      applicable.length > 0
        ? applicable.reduce((sum, c) => sum + (c.maturity ?? 0), 0) / applicable.length
        : null;

    return {
      id: domain.id,
      code: domain.code,
      title: domain.title,
      controls,
      averageMaturity,
      percentage: averageMaturity != null ? (averageMaturity / maxMaturity) * 100 : null,
      applicableCount: applicable.length,
      answeredCount: answered.length,
    };
  });

  const allApplicable = scoredDomains.flatMap((d) => d.controls.filter((c) => c.status !== "NOT_APPLICABLE"));
  const allAnswered = allApplicable.filter((c) => c.maturity != null);
  const overallAverageMaturity =
    allApplicable.length > 0
      ? allApplicable.reduce((sum, c) => sum + (c.maturity ?? 0), 0) / allApplicable.length
      : null;
  const overallPercentage = overallAverageMaturity != null ? (overallAverageMaturity / maxMaturity) * 100 : null;

  const gaps: Gap[] = scoredDomains.flatMap((domain) =>
    domain.controls
      .filter((c) => c.status !== "NOT_APPLICABLE" && (c.maturity ?? 0) < targetMaturity)
      .map((control) => ({ domainCode: domain.code, domainTitle: domain.title, control })),
  );

  return {
    domains: scoredDomains,
    overallAverageMaturity,
    overallPercentage,
    readinessBand: overallPercentage != null ? readinessBand(overallPercentage) : null,
    totalControls: domains.reduce((sum, d) => sum + d.controls.length, 0),
    applicableControls: allApplicable.length,
    answeredControls: allAnswered.length,
    gaps,
  };
}
