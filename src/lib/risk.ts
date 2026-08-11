import type { AnswerValue } from "@/lib/types";

export const TIER_ORDER: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export const TIER_BADGE: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-800 ring-red-600/20",
  HIGH: "bg-orange-100 text-orange-800 ring-orange-600/20",
  MEDIUM: "bg-amber-100 text-amber-800 ring-amber-600/20",
  LOW: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
};

export const VENDOR_STATUS_BADGE: Record<string, string> = {
  PROSPECTIVE: "bg-slate-100 text-slate-700 ring-slate-500/20",
  ACTIVE: "bg-sky-100 text-sky-800 ring-sky-600/20",
  OFFBOARDING: "bg-amber-100 text-amber-800 ring-amber-600/20",
  INACTIVE: "bg-slate-100 text-slate-500 ring-slate-500/20",
};

export const ASSESSMENT_STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 ring-slate-500/20",
  SENT: "bg-sky-100 text-sky-800 ring-sky-600/20",
  IN_PROGRESS: "bg-amber-100 text-amber-800 ring-amber-600/20",
  COMPLETED: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
};

export const FINDING_STATUS_BADGE: Record<string, string> = {
  OPEN: "bg-red-100 text-red-800 ring-red-600/20",
  IN_PROGRESS: "bg-amber-100 text-amber-800 ring-amber-600/20",
  RESOLVED: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  ACCEPTED_RISK: "bg-slate-100 text-slate-700 ring-slate-500/20",
};

export const ANSWER_BADGE: Record<string, string> = {
  YES: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  NO: "bg-red-100 text-red-800 ring-red-600/20",
  PARTIAL: "bg-amber-100 text-amber-800 ring-amber-600/20",
  NOT_APPLICABLE: "bg-slate-100 text-slate-600 ring-slate-500/20",
  UNANSWERED: "bg-slate-100 text-slate-400 ring-slate-500/20",
};

export function isRiskyAnswer(
  answer: string,
  riskyAnswer: string
): boolean {
  if (answer === "UNANSWERED" || answer === "NOT_APPLICABLE") return false;
  return answer === riskyAnswer;
}

export function scoreFromResponses(
  responses: { weight: number; answer: string; riskFlag: boolean }[]
): number | null {
  const scored = responses.filter(
    (r) => r.answer !== "UNANSWERED" && r.answer !== "NOT_APPLICABLE"
  );
  const denominator = scored.reduce((sum, r) => sum + r.weight, 0);
  if (denominator === 0) return null;
  const numerator = scored
    .filter((r) => !r.riskFlag)
    .reduce((sum, r) => sum + r.weight, 0);
  return Math.round((numerator / denominator) * 100);
}

export function scoreLabel(score: number | null): string {
  if (score === null) return "Not scored";
  if (score >= 90) return "Strong";
  if (score >= 75) return "Adequate";
  if (score >= 50) return "Weak";
  return "Poor";
}

export function scoreColor(score: number | null): string {
  if (score === null) return "text-slate-400";
  if (score >= 90) return "text-emerald-600";
  if (score >= 75) return "text-sky-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

export const ANSWER_OPTIONS: AnswerValue[] = [
  "YES",
  "NO",
  "PARTIAL",
  "NOT_APPLICABLE",
];
