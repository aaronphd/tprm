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
