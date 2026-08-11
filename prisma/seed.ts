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
