import type { FrameworkSeed } from "./types";
import { CMMI_STYLE_MATURITY } from "./maturity-models";

// Domain categories follow the general shape of ISO/IEC 42001:2023 Annex A
// (AI management systems). Unlike the ISO 27001 file, this control set is built from
// general knowledge of the standard's structure rather than a verified reference and
// has not been checked control-by-control against the licensed text — treat the exact
// numbering and coverage as a reasonable starting point, not a certified mapping.
export const iso42001: FrameworkSeed = {
  slug: "iso42001",
  name: "ISO/IEC 42001",
  version: "2023",
  description:
    "AI management system (AIMS) readiness assessment. Adapted for assessment purposes — validate against the licensed ISO/IEC 42001:2023 text before formal certification use.",
  maturityModel: CMMI_STYLE_MATURITY,
  domains: [
    {
      code: "A.2",
      title: "Policies Related to AI",
      controls: [
        { code: "A.2.1", title: "AI policy", description: "Establish, approve, and communicate a policy for the responsible development, deployment, and use of AI systems." },
        { code: "A.2.2", title: "Alignment with organizational policies", description: "Ensure the AI policy is consistent with other management system policies (quality, security, privacy)." },
      ],
    },
    {
      code: "A.3",
      title: "Internal Organization",
      controls: [
        { code: "A.3.1", title: "AI roles and responsibilities", description: "Define and allocate roles and responsibilities for AI governance, including an accountable owner." },
        { code: "A.3.2", title: "Reporting of AI-related concerns", description: "Establish a channel for personnel to report AI concerns, incidents, or ethical issues." },
        { code: "A.3.3", title: "AI risk management process", description: "Establish, implement, and maintain a risk management process specific to AI systems." },
      ],
    },
    {
      code: "A.4",
      title: "Resources for AI Systems",
      controls: [
        { code: "A.4.1", title: "Documentation of resources", description: "Determine and document resources needed to develop and operate AI systems (data, tooling, system resources, human resources)." },
        { code: "A.4.2", title: "Data resources", description: "Identify and document requirements for data used to develop and operate AI systems." },
        { code: "A.4.3", title: "Tooling resources", description: "Identify and document tools used to build, train, test, and deploy AI systems." },
        { code: "A.4.4", title: "Human resources competence", description: "Ensure personnel involved in the AI system life cycle have the necessary competence, including AI-specific training." },
      ],
    },
    {
      code: "A.5",
      title: "Assessing Impacts of AI Systems",
      controls: [
        { code: "A.5.1", title: "AI system impact assessment process", description: "Establish a process to assess the potential consequences of AI systems for individuals and society." },
        { code: "A.5.2", title: "AI system objectives and scope", description: "Document the intended purpose, scope, and context of use for each AI system." },
        { code: "A.5.3", title: "Assessment of impacted stakeholders", description: "Identify individuals and groups who could be affected by the AI system." },
        { code: "A.5.4", title: "Environmental impact", description: "Consider the environmental impact of AI system development and operation." },
      ],
    },
    {
      code: "A.6",
      title: "AI System Life Cycle",
      controls: [
        { code: "A.6.1", title: "AI system life cycle documented", description: "Define and document a process covering the AI system life cycle from design through decommissioning." },
        { code: "A.6.2", title: "Objectives and requirements", description: "Document objectives and requirements for the AI system relevant to its life cycle." },
        { code: "A.6.3", title: "Design and development", description: "Document design and development processes for AI systems." },
        { code: "A.6.4", title: "Verification and validation", description: "Establish measures to verify and validate AI system behavior against requirements before deployment." },
        { code: "A.6.5", title: "Deployment", description: "Ensure a documented and controlled process governs deployment of AI systems into production." },
        { code: "A.6.6", title: "Operation and monitoring", description: "Monitor AI systems in operation for performance drift, errors, and unintended behavior." },
        { code: "A.6.7", title: "Decommissioning", description: "Establish a process to retire AI systems and manage the data and artifacts they used." },
      ],
    },
    {
      code: "A.7",
      title: "Data for AI Systems",
      controls: [
        { code: "A.7.1", title: "Data quality for AI systems", description: "Establish requirements for data quality relevant to the AI system's purpose." },
        { code: "A.7.2", title: "Data provenance", description: "Document the origin and history of data used to develop and operate AI systems." },
        { code: "A.7.3", title: "Data preparation", description: "Document processes for data collection, labeling, cleaning, and preprocessing." },
        { code: "A.7.4", title: "Data acquisition", description: "Ensure data used for AI systems is acquired through documented and legally appropriate means." },
        { code: "A.7.5", title: "Data governance", description: "Apply data governance and life cycle management practices to data used in AI systems." },
        { code: "A.7.6", title: "Bias and representativeness", description: "Assess data used in AI systems for bias and representativeness relative to intended use." },
      ],
    },
    {
      code: "A.8",
      title: "Information for Interested Parties",
      controls: [
        { code: "A.8.1", title: "Transparency information", description: "Provide interested parties with appropriate information about the AI system, including its capabilities and limitations." },
        { code: "A.8.2", title: "AI system documentation", description: "Maintain documentation describing the AI system sufficient for interested parties to understand its operation." },
        { code: "A.8.3", title: "Communication of incidents", description: "Communicate to affected parties when an AI-related incident occurs that affects them." },
        { code: "A.8.4", title: "External reporting", description: "Report to relevant external parties (regulators, customers) as required." },
      ],
    },
    {
      code: "A.9",
      title: "Use of AI Systems",
      controls: [
        { code: "A.9.1", title: "Intended use documented", description: "Document the intended use of each AI system and communicate it to users." },
        { code: "A.9.2", title: "Human oversight", description: "Establish appropriate human oversight mechanisms proportional to the AI system's risk." },
        { code: "A.9.3", title: "Responsible use guidance", description: "Provide guidance to users on the responsible and appropriate use of the AI system." },
      ],
    },
    {
      code: "A.10",
      title: "Third-Party and Customer Relationships",
      controls: [
        { code: "A.10.1", title: "Third-party AI supplier requirements", description: "Identify and document information security and AI-specific requirements for third-party AI suppliers." },
        { code: "A.10.2", title: "Allocation of responsibilities in the supply chain", description: "Clarify and document AI-related responsibilities between the organization and its AI suppliers or customers." },
        { code: "A.10.3", title: "Customer AI system requirements", description: "Manage requirements from customers relating to AI systems provided to them." },
      ],
    },
  ],
};
