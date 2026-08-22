import { PrismaClient } from "@prisma/client";
import { isRiskyAnswer, scoreFromResponses } from "../src/lib/risk";

const prisma = new PrismaClient();

const QUESTIONS: {
  category: string;
  text: string;
  weight: number;
  riskyAnswer: string;
}[] = [
  // Data Security
  {
    category: "Data Security",
    text: "Is data encrypted at rest using an industry-standard algorithm (e.g. AES-256)?",
    weight: 3,
    riskyAnswer: "NO",
  },
  {
    category: "Data Security",
    text: "Is data encrypted in transit (TLS 1.2+) for all connections handling our data?",
    weight: 3,
    riskyAnswer: "NO",
  },
  {
    category: "Data Security",
    text: "Does the vendor have a documented data retention and secure disposal policy?",
    weight: 2,
    riskyAnswer: "NO",
  },
  // Access Control
  {
    category: "Access Control",
    text: "Is multi-factor authentication enforced for all administrative access?",
    weight: 3,
    riskyAnswer: "NO",
  },
  {
    category: "Access Control",
    text: "Is access to customer data provisioned on a least-privilege, role-based basis?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Access Control",
    text: "Are user access rights reviewed on at least a quarterly basis?",
    weight: 1,
    riskyAnswer: "NO",
  },
  // Incident Response
  {
    category: "Incident Response",
    text: "Does the vendor maintain a documented, tested incident response plan?",
    weight: 3,
    riskyAnswer: "NO",
  },
  {
    category: "Incident Response",
    text: "Will the vendor notify us of a confirmed security incident within 72 hours?",
    weight: 3,
    riskyAnswer: "NO",
  },
  {
    category: "Incident Response",
    text: "Has the vendor experienced a security breach affecting customer data in the last 24 months?",
    weight: 2,
    riskyAnswer: "YES",
  },
  // Business Continuity & Resilience
  {
    category: "Business Continuity & Resilience",
    text: "Does the vendor maintain a documented business continuity / disaster recovery plan?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Business Continuity & Resilience",
    text: "Is the DR plan tested at least annually?",
    weight: 1,
    riskyAnswer: "NO",
  },
  {
    category: "Business Continuity & Resilience",
    text: "Are backups encrypted and stored in a geographically separate location?",
    weight: 2,
    riskyAnswer: "NO",
  },
  // Compliance & Legal
  {
    category: "Compliance & Legal",
    text: "Does the vendor hold a current SOC 2 Type II report or equivalent independent attestation?",
    weight: 3,
    riskyAnswer: "NO",
  },
  {
    category: "Compliance & Legal",
    text: "Is the vendor willing to sign our standard Data Processing Agreement (DPA)?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Compliance & Legal",
    text: "Does the vendor carry cyber liability insurance covering data breach costs?",
    weight: 1,
    riskyAnswer: "NO",
  },
  // Subprocessors & Fourth-Party Risk
  {
    category: "Subprocessors & Fourth-Party Risk",
    text: "Does the vendor maintain and publish a current list of subprocessors?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Subprocessors & Fourth-Party Risk",
    text: "Will the vendor notify us before onboarding a new subprocessor with access to our data?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Subprocessors & Fourth-Party Risk",
    text: "Does the vendor contractually require subprocessors to meet equivalent security obligations?",
    weight: 1,
    riskyAnswer: "NO",
  },
];

// HECVAT-Lite-style questionnaire, adapted for K-12 public school ed-tech
// procurement. Structured around HECVAT-Lite's well-known category set
// (data handling, app/infra security, access control, personnel, compliance,
// incident response, subprocessors) plus a few K-12-specific items (FERPA,
// COPPA, student data sale/advertising, contract-end deletion). This is
// NOT a verbatim reproduction of the official EDUCAUSE HECVAT-Lite
// document — verify against the current official version before relying
// on it for a binding procurement or compliance decision.
const HECVAT_LITE_QUESTIONS: {
  category: string;
  text: string;
  weight: number;
  riskyAnswer: string;
}[] = [
  // Data Handling & Classification
  {
    category: "Data Handling & Classification",
    text: "Does the vendor classify and inventory the types of data (including student data) it collects, processes, or stores on our behalf?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Data Handling & Classification",
    text: "Is data encrypted at rest using industry-standard encryption (e.g. AES-256)?",
    weight: 3,
    riskyAnswer: "NO",
  },
  {
    category: "Data Handling & Classification",
    text: "Is data encrypted in transit (TLS 1.2+) for all connections?",
    weight: 3,
    riskyAnswer: "NO",
  },
  {
    category: "Data Handling & Classification",
    text: "Does the vendor have a documented data retention and secure disposal/destruction policy?",
    weight: 2,
    riskyAnswer: "NO",
  },
  // Application & Infrastructure Security
  {
    category: "Application & Infrastructure Security",
    text: "Does the vendor perform regular vulnerability scanning and penetration testing of the application/infrastructure?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Application & Infrastructure Security",
    text: "Is there a documented patch management process for critical and high-severity vulnerabilities?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Application & Infrastructure Security",
    text: "Are production, staging, and development environments logically separated?",
    weight: 1,
    riskyAnswer: "NO",
  },
  // Authentication & Access Control
  {
    category: "Authentication & Access Control",
    text: "Is multi-factor authentication (MFA) available and enforced for administrative/privileged accounts?",
    weight: 3,
    riskyAnswer: "NO",
  },
  {
    category: "Authentication & Access Control",
    text: "Is access provisioned on a least-privilege, role-based basis with periodic access reviews?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Authentication & Access Control",
    text: "Are authentication events and administrative actions logged and monitored?",
    weight: 2,
    riskyAnswer: "NO",
  },
  // Policies & Personnel Security
  {
    category: "Policies & Personnel Security",
    text: "Does the vendor conduct background checks on employees/contractors with access to our data?",
    weight: 1,
    riskyAnswer: "NO",
  },
  {
    category: "Policies & Personnel Security",
    text: "Do employees receive annual security awareness and data privacy training?",
    weight: 1,
    riskyAnswer: "NO",
  },
  {
    category: "Policies & Personnel Security",
    text: "Is access revoked promptly (e.g. within 24 hours) upon employee termination or role change?",
    weight: 2,
    riskyAnswer: "NO",
  },
  // Compliance & Independent Assessment
  {
    category: "Compliance & Independent Assessment",
    text: "Has the vendor completed an independent security assessment (e.g. SOC 2 Type II, ISO 27001) within the last 12 months?",
    weight: 3,
    riskyAnswer: "NO",
  },
  {
    category: "Compliance & Independent Assessment",
    text: "Will the vendor provide a copy of its most recent third-party security audit or attestation upon request?",
    weight: 1,
    riskyAnswer: "NO",
  },
  // Business Continuity & Incident Response
  {
    category: "Business Continuity & Incident Response",
    text: "Does the vendor maintain a documented, tested incident response plan?",
    weight: 3,
    riskyAnswer: "NO",
  },
  {
    category: "Business Continuity & Incident Response",
    text: "Will the vendor notify the district of a confirmed security incident affecting our data within a specified timeframe (e.g. 72 hours)?",
    weight: 3,
    riskyAnswer: "NO",
  },
  {
    category: "Business Continuity & Incident Response",
    text: "Does the vendor maintain a business continuity / disaster recovery plan tested at least annually?",
    weight: 2,
    riskyAnswer: "NO",
  },
  // Subcontractors & Data Sharing
  {
    category: "Subcontractors & Data Sharing",
    text: "Does the vendor maintain and disclose a current list of subprocessors with access to district/student data?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Subcontractors & Data Sharing",
    text: "Will the vendor notify the district before engaging a new subprocessor with access to our data?",
    weight: 1,
    riskyAnswer: "NO",
  },
  {
    category: "Subcontractors & Data Sharing",
    text: "Does the vendor contractually require subprocessors to meet equivalent data protection obligations?",
    weight: 1,
    riskyAnswer: "NO",
  },
  // Student Data Privacy (K-12 specific)
  {
    category: "Student Data Privacy",
    text: "Does the vendor comply with FERPA and applicable state student data privacy laws?",
    weight: 3,
    riskyAnswer: "NO",
  },
  {
    category: "Student Data Privacy",
    text: "If the service may be used by children under 13, does the vendor comply with COPPA?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Student Data Privacy",
    text: "Is student data sold, or used for targeted advertising or profiling unrelated to the contracted educational service?",
    weight: 3,
    riskyAnswer: "YES",
  },
  {
    category: "Student Data Privacy",
    text: "Will the vendor sign the district's (or applicable state-mandated) student data privacy agreement?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Student Data Privacy",
    text: "Will student data be deleted or returned within a defined period after contract termination?",
    weight: 2,
    riskyAnswer: "NO",
  },
];

// Real HECVAT Lite, sourced from EDUCAUSE (Higher Education Community
// Vendor Assessment Toolkit) — https://www.educause.edu/higher-education-community-vendor-assessment-toolkit
// Converted from the official free-text/select/yes-no-N/A question types
// into this app's YES/NO/PARTIAL/NOT_APPLICABLE + weighted scoring model.
// Purely descriptive/free-text items (company overview, contact info,
// hosting location, RTO/RPO, notification-time commitments) are kept as
// weight-0 "informational" questions -- they show up in the assessment so
// nothing from the source document is silently dropped, but they're
// answered via the per-question notes field rather than driving the score.
const HECVAT_LITE_REAL_QUESTIONS: {
  category: string;
  text: string;
  weight: number;
  riskyAnswer: string;
}[] = [
  // Company Overview
  {
    category: "Company Overview",
    text: "Provide a brief overview of your company and the service being assessed. (informational — not scored; use notes for details)",
    weight: 0,
    riskyAnswer: "NOT_APPLICABLE",
  },
  {
    category: "Company Overview",
    text: "How long has your company been in business? (informational — not scored; use notes for details)",
    weight: 0,
    riskyAnswer: "NOT_APPLICABLE",
  },
  {
    category: "Company Overview",
    text: "Is the company headquartered in the United States?",
    weight: 1,
    riskyAnswer: "NO",
  },
  {
    category: "Company Overview",
    text: "Who will be the primary point of contact for security and privacy inquiries? (informational — not scored; use notes for details)",
    weight: 0,
    riskyAnswer: "NOT_APPLICABLE",
  },
  // Documentation
  {
    category: "Documentation",
    text: "Do you have a documented information security program?",
    weight: 3,
    riskyAnswer: "NO",
  },
  {
    category: "Documentation",
    text: "Do you have a documented privacy program?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Documentation",
    text: "Are your security policies reviewed at least annually?",
    weight: 1,
    riskyAnswer: "NO",
  },
  {
    category: "Documentation",
    text: "Do you have a documented incident response plan?",
    weight: 3,
    riskyAnswer: "NO",
  },
  {
    category: "Documentation",
    text: "Do you have a documented business continuity / disaster recovery plan?",
    weight: 2,
    riskyAnswer: "NO",
  },
  // Third Parties
  {
    category: "Third Parties",
    text: "Does the solution rely on any third-party providers or subprocessors? (informational — not scored; use notes for details)",
    weight: 0,
    riskyAnswer: "NOT_APPLICABLE",
  },
  {
    category: "Third Parties",
    text: "List all subprocessors that will process institutional data. (informational — not scored; use notes for details)",
    weight: 0,
    riskyAnswer: "NOT_APPLICABLE",
  },
  {
    category: "Third Parties",
    text: "Do you conduct security assessments of your subprocessors?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Third Parties",
    text: "Do you provide advance notice to customers of subprocessor changes?",
    weight: 1,
    riskyAnswer: "NO",
  },
  // Application / Service Security
  {
    category: "Application / Service Security",
    text: "Is the application scanned for vulnerabilities on a regular basis?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Application / Service Security",
    text: "Do you conduct penetration testing at least annually?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Application / Service Security",
    text: "Are secure coding standards followed (e.g. OWASP)?",
    weight: 1,
    riskyAnswer: "NO",
  },
  {
    category: "Application / Service Security",
    text: "Do you have a documented software development lifecycle (SDLC)?",
    weight: 1,
    riskyAnswer: "NO",
  },
  {
    category: "Application / Service Security",
    text: "Is a public-facing vulnerability disclosure program in place?",
    weight: 1,
    riskyAnswer: "NO",
  },
  // Authentication & Identity
  {
    category: "Authentication & Identity",
    text: "Does the solution support single sign-on (SAML 2.0 or OIDC)?",
    weight: 1,
    riskyAnswer: "NO",
  },
  {
    category: "Authentication & Identity",
    text: "Does the solution support multi-factor authentication?",
    weight: 3,
    riskyAnswer: "NO",
  },
  {
    category: "Authentication & Identity",
    text: "Is MFA required for administrative access?",
    weight: 3,
    riskyAnswer: "NO",
  },
  {
    category: "Authentication & Identity",
    text: "Are password complexity and rotation policies enforced?",
    weight: 1,
    riskyAnswer: "NO",
  },
  {
    category: "Authentication & Identity",
    text: "Can customers configure their own password / MFA policies?",
    weight: 1,
    riskyAnswer: "NO",
  },
  // Data Handling
  {
    category: "Data Handling",
    text: "Is data encrypted at rest using industry-standard algorithms?",
    weight: 3,
    riskyAnswer: "NO",
  },
  {
    category: "Data Handling",
    text: "Is data encrypted in transit (TLS 1.2 or higher)?",
    weight: 3,
    riskyAnswer: "NO",
  },
  {
    category: "Data Handling",
    text: "Where is customer data hosted geographically? (informational — not scored; use notes for details)",
    weight: 0,
    riskyAnswer: "NOT_APPLICABLE",
  },
  {
    category: "Data Handling",
    text: "Do you have documented data retention and destruction procedures?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Data Handling",
    text: "Can customers export their data upon request?",
    weight: 1,
    riskyAnswer: "NO",
  },
  {
    category: "Data Handling",
    text: "Is customer data logically or physically segregated from other customers?",
    weight: 1,
    riskyAnswer: "NO",
  },
  // Datacenter & Infrastructure
  {
    category: "Datacenter & Infrastructure",
    text: "Are datacenter facilities SSAE 18 / SOC 2 certified or equivalent?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Datacenter & Infrastructure",
    text: "Are physical access controls in place at all facilities?",
    weight: 1,
    riskyAnswer: "NO",
  },
  {
    category: "Datacenter & Infrastructure",
    text: "Do you maintain redundancy for critical infrastructure?",
    weight: 1,
    riskyAnswer: "NO",
  },
  // Business Continuity & DR
  {
    category: "Business Continuity & DR",
    text: "What is your target recovery time objective (RTO)? (informational — not scored; use notes for details)",
    weight: 0,
    riskyAnswer: "NOT_APPLICABLE",
  },
  {
    category: "Business Continuity & DR",
    text: "What is your target recovery point objective (RPO)? (informational — not scored; use notes for details)",
    weight: 0,
    riskyAnswer: "NOT_APPLICABLE",
  },
  {
    category: "Business Continuity & DR",
    text: "Is the BC/DR plan tested at least annually?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Business Continuity & DR",
    text: "Are backups encrypted and stored off-site?",
    weight: 2,
    riskyAnswer: "NO",
  },
  // Change Management
  {
    category: "Change Management",
    text: "Is there a documented change management process for production changes?",
    weight: 1,
    riskyAnswer: "NO",
  },
  {
    category: "Change Management",
    text: "Are changes tested prior to production deployment?",
    weight: 1,
    riskyAnswer: "NO",
  },
  {
    category: "Change Management",
    text: "Are customers notified in advance of major service changes?",
    weight: 1,
    riskyAnswer: "NO",
  },
  // Incident Response
  {
    category: "Incident Response",
    text: "Do you have a documented breach notification process?",
    weight: 3,
    riskyAnswer: "NO",
  },
  {
    category: "Incident Response",
    text: "What is the maximum time to notify customers of a security incident? (informational — not scored; use notes for details)",
    weight: 0,
    riskyAnswer: "NOT_APPLICABLE",
  },
  {
    category: "Incident Response",
    text: "Do you conduct incident response tabletop exercises?",
    weight: 1,
    riskyAnswer: "NO",
  },
  {
    category: "Incident Response",
    text: "Do you maintain cyber insurance coverage?",
    weight: 1,
    riskyAnswer: "NO",
  },
  // Privacy
  {
    category: "Privacy",
    text: "Do you sell, rent, or trade any customer or end-user data?",
    weight: 3,
    riskyAnswer: "YES",
  },
  {
    category: "Privacy",
    text: "Do you use customer or end-user data for advertising?",
    weight: 2,
    riskyAnswer: "YES",
  },
  {
    category: "Privacy",
    text: "Do you provide a signed Data Processing Agreement (DPA)?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Privacy",
    text: "Do you support data subject rights requests (access, correction, deletion)?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Privacy",
    text: "Do you comply with FERPA when handling student educational records?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Privacy",
    text: "Do you comply with COPPA when handling data of children under 13?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Privacy",
    text: "Are you a signatory to the Student Privacy Pledge?",
    weight: 1,
    riskyAnswer: "NO",
  },
  // HIPAA (if applicable)
  {
    category: "HIPAA (if applicable)",
    text: "Do you handle Protected Health Information (PHI)? (informational — not scored; use notes for details)",
    weight: 0,
    riskyAnswer: "NOT_APPLICABLE",
  },
  {
    category: "HIPAA (if applicable)",
    text: "Will you execute a Business Associate Agreement (BAA) with the customer?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "HIPAA (if applicable)",
    text: "Have you completed a HIPAA Security Rule risk assessment in the last 12 months?",
    weight: 2,
    riskyAnswer: "NO",
  },
];

// The Isaacs Group — original privacy & compliance deep-dive. Not derived
// from any single external framework document; questions are written to
// probe FERPA, COPPA, PHI/HIPAA, the common baseline across state
// comprehensive privacy laws, SOC 2, and ISO/IEC 27001 diligence points.
// The "State Privacy & Breach Notification Laws" section is a consolidated
// baseline rather than 50 individual per-state items -- confirm exact
// state-specific deadlines separately (e.g. via a breach-notification
// timeline workflow) if an actual incident occurs.
const ISAACS_PRIVACY_QUESTIONS: {
  category: string;
  text: string;
  weight: number;
  riskyAnswer: string;
}[] = [
  // FERPA
  {
    category: "FERPA (Family Educational Rights & Privacy Act)",
    text: "Does the vendor operate as a FERPA \"school official\" under the institution's direct control, per the school-official exception?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "FERPA (Family Educational Rights & Privacy Act)",
    text: "Can directory-information designation be disabled per student upon institution or parent request?",
    weight: 1,
    riskyAnswer: "NO",
  },
  {
    category: "FERPA (Family Educational Rights & Privacy Act)",
    text: "Is there a documented process for parents/eligible students to inspect and request correction of education records?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "FERPA (Family Educational Rights & Privacy Act)",
    text: "Will education records be destroyed or returned within a defined period after contract termination?",
    weight: 2,
    riskyAnswer: "NO",
  },
  // COPPA
  {
    category: "COPPA (Children's Online Privacy Protection Act)",
    text: "Is the service directed to, or does it have actual knowledge of collecting personal information from, children under 13? (informational — not scored; use notes for details)",
    weight: 0,
    riskyAnswer: "NOT_APPLICABLE",
  },
  {
    category: "COPPA (Children's Online Privacy Protection Act)",
    text: "Where COPPA applies, is a COPPA-compliant consent mechanism in place (e.g. school-official consent under the FERPA exception, or verifiable parental consent)?",
    weight: 3,
    riskyAnswer: "NO",
  },
  {
    category: "COPPA (Children's Online Privacy Protection Act)",
    text: "Is any behavioral advertising, tracking, or profiling performed on data collected from children under 13?",
    weight: 3,
    riskyAnswer: "YES",
  },
  {
    category: "COPPA (Children's Online Privacy Protection Act)",
    text: "Is there a defined retention period and deletion process for data collected from children?",
    weight: 2,
    riskyAnswer: "NO",
  },
  // PHI / HIPAA
  {
    category: "PHI / HIPAA",
    text: "Will the vendor access, create, or maintain Protected Health Information (PHI) as a HIPAA Business Associate or subcontracted Business Associate? (informational — not scored; use notes for details)",
    weight: 0,
    riskyAnswer: "NOT_APPLICABLE",
  },
  {
    category: "PHI / HIPAA",
    text: "Where PHI is involved, will the vendor execute a HIPAA Business Associate Agreement (BAA)?",
    weight: 3,
    riskyAnswer: "NO",
  },
  {
    category: "PHI / HIPAA",
    text: "Is PHI encrypted at rest and in transit using industry-standard algorithms and key management?",
    weight: 3,
    riskyAnswer: "NO",
  },
  {
    category: "PHI / HIPAA",
    text: "Does the vendor commit to breach notification consistent with the HIPAA Breach Notification Rule (no later than 60 days)?",
    weight: 3,
    riskyAnswer: "NO",
  },
  {
    category: "PHI / HIPAA",
    text: "Do personnel with PHI access receive HIPAA workforce training on a recurring, documented basis?",
    weight: 1,
    riskyAnswer: "NO",
  },
  {
    category: "PHI / HIPAA",
    text: "Has a HIPAA Security Rule risk assessment been completed within the last 12 months?",
    weight: 2,
    riskyAnswer: "NO",
  },
  // State privacy laws
  {
    category: "U.S. State Privacy & Breach Notification Laws",
    text: "Is there an operational process to honor consumer/data-subject rights requests (access, correction, deletion, portability, opt-out of sale/sharing/targeted advertising) as required under applicable state comprehensive privacy laws (e.g. CCPA/CPRA and comparable state acts)?",
    weight: 3,
    riskyAnswer: "NO",
  },
  {
    category: "U.S. State Privacy & Breach Notification Laws",
    text: "Is personal information sold, or shared/disclosed for cross-context behavioral advertising, as those terms are defined under state privacy laws?",
    weight: 2,
    riskyAnswer: "YES",
  },
  {
    category: "U.S. State Privacy & Breach Notification Laws",
    text: "Is a data processing/protection agreement available with state-law-required terms (purpose limitation, subprocessor flow-down, deletion/return obligations)?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "U.S. State Privacy & Breach Notification Laws",
    text: "Does the vendor commit to notifying the institution of a security breach involving personal information without unreasonable delay, sufficient to meet the notification deadlines of all applicable state breach-notification laws?",
    weight: 3,
    riskyAnswer: "NO",
  },
  {
    category: "U.S. State Privacy & Breach Notification Laws",
    text: "Are data protection/privacy impact assessments performed for processing activities presenting heightened risk, as required under several state privacy laws?",
    weight: 1,
    riskyAnswer: "NO",
  },
  // SOC 2
  {
    category: "SOC 2",
    text: "Has the vendor completed a SOC 2 audit (Type I or Type II)? (informational — not scored; use notes for details)",
    weight: 0,
    riskyAnswer: "NOT_APPLICABLE",
  },
  {
    category: "SOC 2",
    text: "Is the most recent SOC 2 report a Type II report covering an observation period of at least 6 months?",
    weight: 3,
    riskyAnswer: "NO",
  },
  {
    category: "SOC 2",
    text: "Does the report's Trust Services Criteria scope include, at minimum, the Security (Common Criteria) category?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "SOC 2",
    text: "Is the report dated within the last 12 months?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "SOC 2",
    text: "Are there any qualified opinions, exceptions, or unresolved deviations noted in the report?",
    weight: 2,
    riskyAnswer: "YES",
  },
  {
    category: "SOC 2",
    text: "Will the vendor provide a bridge letter or updated report for any gap period between the report date and contract execution?",
    weight: 1,
    riskyAnswer: "NO",
  },
  // ISO/IEC 27001
  {
    category: "ISO/IEC 27001",
    text: "Is the organization's Information Security Management System (ISMS) currently certified to ISO/IEC 27001? (informational — not scored; use notes for details)",
    weight: 0,
    riskyAnswer: "NOT_APPLICABLE",
  },
  {
    category: "ISO/IEC 27001",
    text: "Does the certification scope cover the systems, personnel, and facilities used to deliver the assessed service (not just a subset of the company)?",
    weight: 3,
    riskyAnswer: "NO",
  },
  {
    category: "ISO/IEC 27001",
    text: "Is the certificate current (not expired) and issued by an accredited certification body?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "ISO/IEC 27001",
    text: "Has the organization passed its most recent annual surveillance audit without major nonconformities?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "ISO/IEC 27001",
    text: "Will the vendor provide a Statement of Applicability (SoA) or summary of applicable Annex A controls upon request?",
    weight: 1,
    riskyAnswer: "NO",
  },
  {
    category: "ISO/IEC 27001",
    text: "Is the certification aligned to the ISO/IEC 27001:2022 revision (updated Annex A control set)?",
    weight: 1,
    riskyAnswer: "NO",
  },
];

// HECVAT-AI Addendum, sourced from EDUCAUSE — AI-specific supplement to
// HECVAT covering model use, training data, transparency, and governance.
// Same conversion approach as HECVAT Lite: descriptive/free-text source
// items become unscored informational questions answered via notes.
const HECVAT_AI_QUESTIONS: {
  category: string;
  text: string;
  weight: number;
  riskyAnswer: string;
}[] = [
  // AI Use in Product
  {
    category: "AI Use in Product",
    text: "Does the product use artificial intelligence, machine learning, or generative AI? (informational — not scored; use notes for details)",
    weight: 0,
    riskyAnswer: "NOT_APPLICABLE",
  },
  {
    category: "AI Use in Product",
    text: "Describe the AI/ML use cases within the product. (informational — not scored; use notes for details)",
    weight: 0,
    riskyAnswer: "NOT_APPLICABLE",
  },
  {
    category: "AI Use in Product",
    text: "Are third-party AI models or APIs used (OpenAI, Anthropic, Google, etc.)? (informational — not scored; use notes for details)",
    weight: 0,
    riskyAnswer: "NOT_APPLICABLE",
  },
  {
    category: "AI Use in Product",
    text: "Is model inference performed in-region, or is data sent to external providers? (informational — not scored; use notes for details)",
    weight: 0,
    riskyAnswer: "NOT_APPLICABLE",
  },
  // Training Data
  {
    category: "Training Data",
    text: "Is customer or end-user data used to train or fine-tune the vendor's AI models? (informational — not scored; use notes on the consent model: opt-in / default opt-in / no consent)",
    weight: 0,
    riskyAnswer: "NOT_APPLICABLE",
  },
  {
    category: "Training Data",
    text: "Is there a documented mechanism for customers to opt out of having their data used for model training?",
    weight: 3,
    riskyAnswer: "NO",
  },
  {
    category: "Training Data",
    text: "Is training-data opt-out the default for enterprise or education-tier customers?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Training Data",
    text: "What is the provenance of the training data (public web, licensed, synthetic, customer-provided)? (informational — not scored; use notes for details)",
    weight: 0,
    riskyAnswer: "NOT_APPLICABLE",
  },
  // Transparency & Governance
  {
    category: "Transparency & Governance",
    text: "Are end users notified when they are interacting with an AI system?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Transparency & Governance",
    text: "Can users opt out of AI-driven features?",
    weight: 1,
    riskyAnswer: "NO",
  },
  {
    category: "Transparency & Governance",
    text: "Are human review or override mechanisms in place for consequential decisions?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Transparency & Governance",
    text: "Have you conducted adversarial testing (red-teaming) of the AI system?",
    weight: 1,
    riskyAnswer: "NO",
  },
  {
    category: "Transparency & Governance",
    text: "Is your AI governance program aligned with NIST AI RMF or ISO/IEC 42001?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Transparency & Governance",
    text: "Do you publish model or system cards describing capabilities and limitations?",
    weight: 1,
    riskyAnswer: "NO",
  },
  {
    category: "Transparency & Governance",
    text: "Have any AI-related incidents (hallucination harms, jailbreaks, biased outputs) occurred in the last 12 months?",
    weight: 2,
    riskyAnswer: "YES",
  },
];

// SIG-Parallel Lite (Isaacs) — Isaacs Group original wording covering the
// same eighteen risk domains addressed by Shared Assessments' SIG, for use
// when a SIG license isn't available. Independent phrasing, not derived
// from Shared Assessments' proprietary question text.
const SIG_PARALLEL_LITE_QUESTIONS: {
  category: string;
  text: string;
  weight: number;
  riskyAnswer: string;
}[] = [
  // Enterprise Risk Management
  {
    category: "Enterprise Risk Management",
    text: "Does the organization maintain a documented enterprise risk management program with executive oversight?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Enterprise Risk Management",
    text: "Is cybersecurity risk formally reported to the board or governing body at a defined cadence? (informational — not scored; use notes for the cadence)",
    weight: 0,
    riskyAnswer: "NOT_APPLICABLE",
  },
  // Security Policy
  {
    category: "Security Policy",
    text: "Are information security policies documented, approved by leadership, and reviewed at least annually?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Security Policy",
    text: "Are policies communicated to all personnel with attestation of receipt?",
    weight: 1,
    riskyAnswer: "NO",
  },
  // Organizational Security
  {
    category: "Organizational Security",
    text: "Is there a named security leader (CISO or equivalent) with responsibility for the security program?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Organizational Security",
    text: "Are security roles and responsibilities formally defined and documented?",
    weight: 1,
    riskyAnswer: "NO",
  },
  // Asset & Information Management
  {
    category: "Asset & Information Management",
    text: "Is a current inventory of information assets and data classifications maintained?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Asset & Information Management",
    text: "Are data-handling requirements defined for each classification level?",
    weight: 1,
    riskyAnswer: "NO",
  },
  // Human Resource Security
  {
    category: "Human Resource Security",
    text: "Are background checks conducted on personnel with access to customer data, consistent with applicable law?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Human Resource Security",
    text: "Is security awareness training required at onboarding and annually thereafter?",
    weight: 2,
    riskyAnswer: "NO",
  },
  // Physical & Environmental Security
  {
    category: "Physical & Environmental Security",
    text: "Are physical access controls in place at all facilities that process or store customer data?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Physical & Environmental Security",
    text: "Are environmental protections (fire, power, cooling) documented and monitored?",
    weight: 1,
    riskyAnswer: "NO",
  },
  // IT Operations Management
  {
    category: "IT Operations Management",
    text: "Are documented operational procedures maintained for systems that support the service?",
    weight: 1,
    riskyAnswer: "NO",
  },
  {
    category: "IT Operations Management",
    text: "Is capacity monitored and planned to prevent service degradation?",
    weight: 1,
    riskyAnswer: "NO",
  },
  // Communications & Operations Management
  {
    category: "Communications & Operations Management",
    text: "Are configuration standards (hardening baselines) applied to servers, endpoints, and network devices?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Communications & Operations Management",
    text: "Are system logs collected, monitored, and retained for a defined period?",
    weight: 2,
    riskyAnswer: "NO",
  },
  // Access Control
  {
    category: "Access Control",
    text: "Is access to customer data granted on a least-privilege, need-to-know basis?",
    weight: 3,
    riskyAnswer: "NO",
  },
  {
    category: "Access Control",
    text: "Is multi-factor authentication required for administrative and remote access?",
    weight: 3,
    riskyAnswer: "NO",
  },
  {
    category: "Access Control",
    text: "Are access rights reviewed at least quarterly and revoked promptly upon role change or termination?",
    weight: 2,
    riskyAnswer: "NO",
  },
  // Application Security
  {
    category: "Application Security",
    text: "Are secure coding standards followed in application development?",
    weight: 1,
    riskyAnswer: "NO",
  },
  {
    category: "Application Security",
    text: "Is application security testing (SAST/DAST/pen test) performed prior to release and periodically thereafter?",
    weight: 3,
    riskyAnswer: "NO",
  },
  // Cybersecurity Incident Management
  {
    category: "Cybersecurity Incident Management",
    text: "Is an incident response plan documented and tested at least annually?",
    weight: 3,
    riskyAnswer: "NO",
  },
  {
    category: "Cybersecurity Incident Management",
    text: "What is the committed timeframe for notifying customers of a confirmed security incident affecting their data? (informational — not scored; use notes for details)",
    weight: 0,
    riskyAnswer: "NOT_APPLICABLE",
  },
  // Business Resiliency
  {
    category: "Business Resiliency",
    text: "Are business continuity and disaster recovery plans documented and tested?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Business Resiliency",
    text: "What are the committed RTO and RPO for the service? (informational — not scored; use notes for details)",
    weight: 0,
    riskyAnswer: "NOT_APPLICABLE",
  },
  // Compliance
  {
    category: "Compliance",
    text: "List all current third-party attestations and certifications (SOC 2, ISO 27001, HITRUST, FedRAMP, PCI, etc.). (informational — not scored; use notes for details)",
    weight: 0,
    riskyAnswer: "NOT_APPLICABLE",
  },
  {
    category: "Compliance",
    text: "Are internal audits of the security program conducted at least annually?",
    weight: 1,
    riskyAnswer: "NO",
  },
  // End User Device Security
  {
    category: "End User Device Security",
    text: "Are endpoints managed with EDR/XDR and current anti-malware protection?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "End User Device Security",
    text: "Are endpoint disks encrypted?",
    weight: 2,
    riskyAnswer: "NO",
  },
  // Network Security
  {
    category: "Network Security",
    text: "Are firewalls and network segmentation in place between environments?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Network Security",
    text: "Are all remote-access channels protected by MFA and encrypted transport?",
    weight: 2,
    riskyAnswer: "NO",
  },
  // Privacy
  {
    category: "Privacy",
    text: "Is there a documented privacy program with a designated privacy leader?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Privacy",
    text: "Are data subject rights (access, correction, deletion, portability) supported operationally?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Privacy",
    text: "Are cross-border data transfer mechanisms in place where applicable (SCCs, IDTA, adequacy decisions)?",
    weight: 1,
    riskyAnswer: "NO",
  },
  // Threat Management
  {
    category: "Threat Management",
    text: "Are threat intelligence feeds ingested and acted on operationally?",
    weight: 1,
    riskyAnswer: "NO",
  },
  {
    category: "Threat Management",
    text: "Is a formal vulnerability management program in place with SLAs by severity?",
    weight: 2,
    riskyAnswer: "NO",
  },
  // Server Security
  {
    category: "Server Security",
    text: "Are servers patched to a defined baseline within documented SLAs?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Server Security",
    text: "Are hardened configurations applied and drift monitored?",
    weight: 1,
    riskyAnswer: "NO",
  },
  // Cloud Hosting Services
  {
    category: "Cloud Hosting Services",
    text: "Which cloud service providers host the service, and in which regions? (informational — not scored; use notes for details)",
    weight: 0,
    riskyAnswer: "NOT_APPLICABLE",
  },
  {
    category: "Cloud Hosting Services",
    text: "Is cloud configuration monitored for security drift (CSPM)?",
    weight: 1,
    riskyAnswer: "NO",
  },
  // Third-Party Risk Management
  {
    category: "Third-Party Risk Management",
    text: "Is a documented third-party risk management program in place, including due diligence of subprocessors?",
    weight: 2,
    riskyAnswer: "NO",
  },
  {
    category: "Third-Party Risk Management",
    text: "Are customers notified in advance of material changes to subprocessors?",
    weight: 1,
    riskyAnswer: "NO",
  },
];

// Demo answers for Acme Cloud Hosting's completed assessment, aligned by
// index with QUESTIONS above. Three answers are deliberately risky so the
// demo shows flagged responses, generated findings, and a realistic score.
const DEMO_ANSWERS = [
  "YES", // encrypted at rest
  "YES", // encrypted in transit
  "YES", // retention policy
  "NO", // MFA enforced -> flagged
  "YES", // least-privilege access
  "PARTIAL", // quarterly access review
  "YES", // IR plan documented
  "YES", // 72hr breach notification
  "NO", // breach in last 24mo (NO is the good answer here)
  "YES", // BCP/DR plan
  "PARTIAL", // DR tested annually
  "NO", // backups encrypted offsite -> flagged
  "YES", // SOC 2 Type II
  "NO", // willing to sign DPA -> flagged
  "YES", // cyber liability insurance
  "YES", // subprocessor list published
  "YES", // notify before new subprocessor
  "PARTIAL", // subprocessors contractually bound
];

async function main() {
  const template = await prisma.questionnaireTemplate.upsert({
    where: { id: "default-tprm-template" },
    update: {},
    create: {
      id: "default-tprm-template",
      name: "Standard Vendor Security Assessment",
      description:
        "Baseline third-party risk questionnaire covering data security, access control, incident response, business continuity, compliance, and subprocessor risk.",
      questions: {
        create: QUESTIONS.map((q, i) => ({ ...q, order: i })),
      },
    },
  });

  const hecvatLite = await prisma.questionnaireTemplate.upsert({
    where: { id: "hecvat-lite-k12-template" },
    update: {},
    create: {
      id: "hecvat-lite-k12-template",
      name: "HECVAT-Lite (K-12 Adapted)",
      description:
        "Lighter-weight vendor security questionnaire adapted from the HECVAT-Lite structure for public school ed-tech procurement, with added FERPA/COPPA/student-data-privacy items. Not a verbatim reproduction of the official EDUCAUSE HECVAT-Lite — verify against the current official document before relying on it for a binding compliance decision.",
      questions: {
        create: HECVAT_LITE_QUESTIONS.map((q, i) => ({ ...q, order: i })),
      },
    },
  });
  console.log(`Seeded questionnaire template: ${hecvatLite.name}`);

  const hecvatLiteReal = await prisma.questionnaireTemplate.upsert({
    where: { id: "hecvat-lite-real-template" },
    update: {},
    create: {
      id: "hecvat-lite-real-template",
      name: "HECVAT Lite",
      description:
        "Sourced from EDUCAUSE's Higher Education Community Vendor Assessment Toolkit (HECVAT Lite) — https://www.educause.edu/higher-education-community-vendor-assessment-toolkit. Converted from the source document's free-text/select/yes-no-N/A question types into this app's weighted yes/no/partial/N/A scoring model; purely descriptive items (company overview, hosting location, RTO/RPO, etc.) are kept as unscored informational questions answered via notes. Not a pixel-for-pixel reproduction of the official spreadsheet — treat the official EDUCAUSE document as authoritative for a formal HECVAT exchange with a vendor.",
      questions: {
        create: HECVAT_LITE_REAL_QUESTIONS.map((q, i) => ({ ...q, order: i })),
      },
    },
  });
  console.log(`Seeded questionnaire template: ${hecvatLiteReal.name}`);

  const isaacsPrivacy = await prisma.questionnaireTemplate.upsert({
    where: { id: "isaacs-privacy-compliance-template" },
    update: {},
    create: {
      id: "isaacs-privacy-compliance-template",
      name: "The Isaacs Group — Privacy & Compliance Assessment",
      description:
        "Original Isaacs Group questionnaire for a privacy/compliance deep-dive: FERPA, COPPA, PHI/HIPAA, a consolidated U.S. state privacy & breach-notification law baseline, SOC 2, and ISO/IEC 27001. Not derived from any single external framework document. The state-privacy section is a consolidated baseline, not 50 individual per-state items — confirm exact state-specific deadlines separately if responding to an actual incident.",
      questions: {
        create: ISAACS_PRIVACY_QUESTIONS.map((q, i) => ({ ...q, order: i })),
      },
    },
  });
  console.log(`Seeded questionnaire template: ${isaacsPrivacy.name}`);

  const hecvatAi = await prisma.questionnaireTemplate.upsert({
    where: { id: "hecvat-ai-addendum-template" },
    update: {},
    create: {
      id: "hecvat-ai-addendum-template",
      name: "HECVAT-AI Addendum",
      description:
        "Sourced from EDUCAUSE's HECVAT-AI addendum — a supplement to HECVAT covering AI/ML model use, training data provenance and opt-out, and transparency/governance. Pair with HECVAT Lite for a vendor whose product uses AI. Same conversion approach as HECVAT Lite: descriptive source items are kept as unscored informational questions answered via notes.",
      questions: {
        create: HECVAT_AI_QUESTIONS.map((q, i) => ({ ...q, order: i })),
      },
    },
  });
  console.log(`Seeded questionnaire template: ${hecvatAi.name}`);

  const sigParallelLite = await prisma.questionnaireTemplate.upsert({
    where: { id: "sig-parallel-lite-template" },
    update: {},
    create: {
      id: "sig-parallel-lite-template",
      name: "SIG-Parallel Lite (Isaacs)",
      description:
        "Original Isaacs Group questionnaire covering the eighteen risk domains addressed by Shared Assessments' SIG, in independent wording — not derived from Shared Assessments' proprietary question text. Use in engagements where a SIG license isn't available: Enterprise Risk Management, Security Policy, Organizational Security, Asset & Information Management, HR Security, Physical & Environmental Security, IT Operations, Communications & Operations, Access Control, Application Security, Incident Management, Business Resiliency, Compliance, End User Device Security, Network Security, Privacy, Threat Management, Server Security, Cloud Hosting, and Third-Party Risk Management.",
      questions: {
        create: SIG_PARALLEL_LITE_QUESTIONS.map((q, i) => ({ ...q, order: i })),
      },
    },
  });
  console.log(`Seeded questionnaire template: ${sigParallelLite.name}`);

  const existingVendors = await prisma.vendor.count();
  if (existingVendors === 0) {
    const acme = await prisma.vendor.create({
      data: {
        name: "Acme Cloud Hosting",
        description: "Primary IaaS provider hosting production workloads.",
        category: "Cloud Hosting",
        riskTier: "CRITICAL",
        status: "ACTIVE",
        ownerName: "Aaron",
        contactName: "Jordan Lee",
        contactEmail: "jordan@acmecloud.example",
        contractStart: new Date("2024-01-15"),
        contractEnd: new Date("2027-01-14"),
        dataCategories: JSON.stringify(["financial", "consumerPII", "employeePII"]),
      },
    });

    const northwind = await prisma.vendor.create({
      data: {
        name: "Northwind Payroll",
        description: "Outsourced payroll processing for all employees.",
        category: "Payroll / HR",
        riskTier: "HIGH",
        status: "ACTIVE",
        ownerName: "Aaron",
        contactName: "Priya Shah",
        contactEmail: "priya@northwindpay.example",
        contractStart: new Date("2023-06-01"),
        contractEnd: new Date("2026-05-31"),
        dataCategories: JSON.stringify(["financial", "employeePII"]),
      },
    });

    await prisma.vendor.create({
      data: {
        name: "BrightSign Marketing",
        description: "Email marketing and newsletter platform.",
        category: "Marketing",
        riskTier: "LOW",
        status: "PROSPECTIVE",
        ownerName: "Aaron",
        contactName: "Sam Torres",
        contactEmail: "sam@brightsign.example",
        dataCategories: JSON.stringify(["consumerPII", "behavioral"]),
      },
    });

    console.log("Seeded 3 sample vendors.");

    // A completed assessment for Acme, with 3 flagged answers, so the demo
    // shows a real score and populated dashboard out of the box.
    const templateQuestions = await prisma.questionTemplate.findMany({
      where: { templateId: template.id },
      orderBy: { order: "asc" },
    });

    const responsesData = templateQuestions.map((q, i) => {
      const answer = DEMO_ANSWERS[i] ?? "UNANSWERED";
      return {
        questionTemplateId: q.id,
        category: q.category,
        text: q.text,
        weight: q.weight,
        answer,
        riskFlag: isRiskyAnswer(answer, q.riskyAnswer),
      };
    });

    const score = scoreFromResponses(responsesData);

    const assessment = await prisma.assessment.create({
      data: {
        vendorId: acme.id,
        templateId: template.id,
        title: "Standard Vendor Security Assessment — 2026",
        status: "COMPLETED",
        sentAt: new Date("2026-07-01"),
        completedAt: new Date("2026-07-18"),
        score,
        responses: { create: responsesData },
      },
      include: { responses: true },
    });

    const findByText = (needle: string) =>
      assessment.responses.find((r) => r.text.includes(needle))!;

    await prisma.finding.create({
      data: {
        vendorId: acme.id,
        assessmentId: assessment.id,
        responseId: findByText("multi-factor authentication").id,
        title: "No MFA enforced for administrative access",
        description: "Flagged from the 2026 assessment. Vendor confirmed admin console access does not require MFA today.",
        severity: "HIGH",
        status: "IN_PROGRESS",
        owner: "Jordan Lee (Acme)",
        dueDate: new Date("2026-09-15"),
      },
    });

    await prisma.finding.create({
      data: {
        vendorId: acme.id,
        assessmentId: assessment.id,
        responseId: findByText("Data Processing Agreement").id,
        title: "Vendor has not signed our standard DPA",
        description: "Legal review requested; vendor's counsel proposed redlines still outstanding.",
        severity: "MEDIUM",
        status: "OPEN",
        owner: "Aaron",
        dueDate: new Date("2026-07-30"), // in the past relative to seed date -> shows as overdue
      },
    });

    await prisma.finding.create({
      data: {
        vendorId: acme.id,
        assessmentId: assessment.id,
        responseId: findByText("backups encrypted").id,
        title: "Backups not encrypted / not geographically separated",
        description: "Vendor enabled cross-region encrypted backups after remediation call.",
        severity: "MEDIUM",
        status: "RESOLVED",
        owner: "Jordan Lee (Acme)",
        resolvedAt: new Date("2026-08-05"),
      },
    });

    await prisma.finding.create({
      data: {
        vendorId: northwind.id,
        title: "Annual SOC 2 report not yet received for current cycle",
        description: "Requested from vendor's compliance team; following up before contract renewal.",
        severity: "HIGH",
        status: "OPEN",
        owner: "Aaron",
        dueDate: new Date("2026-09-01"),
      },
    });

    console.log("Seeded a completed assessment and 4 sample findings.");
  }

  console.log(`Seeded questionnaire template: ${template.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
