export const RISK_TIERS = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
export type RiskTier = (typeof RISK_TIERS)[number];

export const VENDOR_STATUSES = [
  "PROSPECTIVE",
  "ACTIVE",
  "OFFBOARDING",
  "INACTIVE",
] as const;
export type VendorStatus = (typeof VENDOR_STATUSES)[number];

export const ASSESSMENT_STATUSES = [
  "DRAFT",
  "SENT",
  "IN_PROGRESS",
  "COMPLETED",
] as const;
export type AssessmentStatus = (typeof ASSESSMENT_STATUSES)[number];

export const ANSWER_VALUES = [
  "UNANSWERED",
  "YES",
  "NO",
  "PARTIAL",
  "NOT_APPLICABLE",
] as const;
export type AnswerValue = (typeof ANSWER_VALUES)[number];

export const FINDING_SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
export type FindingSeverity = (typeof FINDING_SEVERITIES)[number];

export const FINDING_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "ACCEPTED_RISK",
] as const;
export type FindingStatus = (typeof FINDING_STATUSES)[number];

export const LABELS: Record<string, string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
  PROSPECTIVE: "Prospective",
  ACTIVE: "Active",
  OFFBOARDING: "Offboarding",
  INACTIVE: "Inactive",
  DRAFT: "Draft",
  SENT: "Sent",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  UNANSWERED: "Unanswered",
  YES: "Yes",
  NO: "No",
  PARTIAL: "Partial",
  NOT_APPLICABLE: "N/A",
  OPEN: "Open",
  RESOLVED: "Resolved",
  ACCEPTED_RISK: "Accepted Risk",
};

export function label(value: string): string {
  return LABELS[value] ?? value;
}

// Sensitive-data categories a vendor may handle, used to weight inherent
// risk in the unified risk score (see src/lib/unifiedRisk.ts). Weights are
// illustrative starting points, not a regulatory determination -- adjust
// to your own risk appetite.
export const DATA_CATEGORY_LABELS = {
  studentPII: "Student PII / education records",
  studentUnder13: "Data from children under 13",
  phi: "Protected Health Information (PHI)",
  cji: "Criminal Justice Information (CJI)",
  financial: "Financial account data",
  pci: "Payment card data",
  employeePII: "Employee PII",
  consumerPII: "Consumer PII",
  biometric: "Biometric identifiers",
  genetic: "Genetic information",
  location: "Precise location data",
  behavioral: "Behavioral / usage analytics",
  ai: "Data used to train AI models",
} as const;

export type DataCategory = keyof typeof DATA_CATEGORY_LABELS;

export const DATA_CATEGORIES = Object.keys(DATA_CATEGORY_LABELS) as DataCategory[];

export const DATA_CATEGORY_WEIGHTS: Record<DataCategory, number> = {
  studentPII: 22,
  studentUnder13: 28,
  phi: 30,
  cji: 30,
  financial: 20,
  pci: 22,
  employeePII: 15,
  consumerPII: 15,
  biometric: 25,
  genetic: 30,
  location: 18,
  behavioral: 8,
  ai: 15,
};

export function parseDataCategories(json: string | null): DataCategory[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((c): c is DataCategory => c in DATA_CATEGORY_LABELS);
  } catch {
    return [];
  }
}
