import { PrismaClient } from "@prisma/client";

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

  const existingVendors = await prisma.vendor.count();
  if (existingVendors === 0) {
    await prisma.vendor.create({
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

    await prisma.vendor.create({
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
