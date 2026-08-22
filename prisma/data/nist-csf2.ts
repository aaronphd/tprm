import type { FrameworkSeed } from "./types";
import { CMMI_STYLE_MATURITY } from "./maturity-models";

// Function/category structure (6 functions, 22 categories) verified via web search
// against NIST's published CSF 2.0 Core (Feb 2024) -- this corrects a stale category
// count in the firm's own control-mapping-engine skill notes, which listed 29
// categories (an older/incorrect count). The individual controls within each category
// are a representative set drawn from the framework's ~106 published subcategories,
// not a verified line-by-line reproduction of the NIST core -- validate against the
// official NIST CSF 2.0 Core before formal use.
export const nistCsf2: FrameworkSeed = {
  slug: "nist-csf2",
  name: "NIST CSF 2.0",
  version: "2.0 (Feb 2024)",
  description:
    "NIST Cybersecurity Framework 2.0 readiness assessment across the 6 functions (Govern, Identify, Protect, Detect, Respond, Recover) and their 22 categories. Often paired with ISO 27001 for enterprise engagements.",
  maturityModel: CMMI_STYLE_MATURITY,
  domains: [
    {
      code: "GV.OC",
      title: "Govern: Organizational Context",
      controls: [
        { code: "GV.OC-1", title: "Mission understood", description: "The organizational mission is understood and informs cybersecurity risk management." },
        { code: "GV.OC-2", title: "Stakeholder expectations identified", description: "Internal and external stakeholders and their cybersecurity expectations are identified." },
        { code: "GV.OC-3", title: "Legal and regulatory requirements understood", description: "Legal, regulatory, and contractual cybersecurity requirements are understood and managed." },
        { code: "GV.OC-4", title: "Critical objectives and services identified", description: "Critical objectives, capabilities, and services that stakeholders depend on are identified and communicated." },
      ],
    },
    {
      code: "GV.RM",
      title: "Govern: Risk Management Strategy",
      controls: [
        { code: "GV.RM-1", title: "Risk management objectives established", description: "Risk management objectives are established and agreed upon by organizational stakeholders." },
        { code: "GV.RM-2", title: "Risk appetite and tolerance established", description: "Risk appetite and risk tolerance statements are established, communicated, and maintained." },
        { code: "GV.RM-3", title: "Cybersecurity risk in enterprise risk management", description: "Cybersecurity risk management activities and outcomes are included in enterprise risk management processes." },
        { code: "GV.RM-4", title: "Strategic risk response direction", description: "Strategic direction describing appropriate risk response options is established and communicated." },
      ],
    },
    {
      code: "GV.RR",
      title: "Govern: Roles, Responsibilities, and Authorities",
      controls: [
        { code: "GV.RR-1", title: "Leadership accountability", description: "Organizational leadership is responsible and accountable for cybersecurity risk and fosters a risk-aware culture." },
        { code: "GV.RR-2", title: "Roles and responsibilities established", description: "Roles, responsibilities, and authorities related to cybersecurity risk management are established and communicated." },
        { code: "GV.RR-3", title: "Adequate resources allocated", description: "Adequate resources are allocated commensurate with the cybersecurity risk management strategy." },
      ],
    },
    {
      code: "GV.PO",
      title: "Govern: Policy",
      controls: [
        { code: "GV.PO-1", title: "Cybersecurity policy established", description: "Policy for managing cybersecurity risks is established based on organizational context, strategy, and priorities." },
        { code: "GV.PO-2", title: "Policy reviewed and updated", description: "Policy is reviewed, updated, and communicated to reflect changes in requirements, threats, and lessons learned." },
      ],
    },
    {
      code: "GV.OV",
      title: "Govern: Oversight",
      controls: [
        { code: "GV.OV-1", title: "Strategy outcomes reviewed", description: "Cybersecurity risk management strategy outcomes are reviewed to inform and adjust the strategy." },
        { code: "GV.OV-2", title: "Performance evaluated", description: "Cybersecurity risk management performance is evaluated and reviewed for adjustments needed." },
        { code: "GV.OV-3", title: "Reporting to leadership", description: "Organizational cybersecurity risk management performance is reported to senior leadership and the board." },
      ],
    },
    {
      code: "GV.SC",
      title: "Govern: Cybersecurity Supply Chain Risk Management",
      controls: [
        { code: "GV.SC-1", title: "Supply chain risk management program", description: "A cybersecurity supply chain risk management program, strategy, and objectives are established and agreed to by stakeholders." },
        { code: "GV.SC-2", title: "Suppliers identified and prioritized", description: "Suppliers are known and prioritized by criticality." },
        { code: "GV.SC-3", title: "Cybersecurity requirements in contracts", description: "Contracts with suppliers address cybersecurity requirements and expectations." },
        { code: "GV.SC-4", title: "Supplier performance monitored", description: "Supplier performance is monitored to meet cybersecurity obligations throughout the relationship." },
        { code: "GV.SC-5", title: "Supply chain integrated into risk management", description: "Supply chain security practices are integrated into cybersecurity and enterprise risk management programs, with performance monitored." },
      ],
    },
    {
      code: "ID.AM",
      title: "Identify: Asset Management",
      controls: [
        { code: "ID.AM-1", title: "Hardware inventory", description: "Inventories of hardware managed by the organization are maintained." },
        { code: "ID.AM-2", title: "Software, services, and systems inventory", description: "Inventories of software, services, and systems managed by the organization are maintained." },
        { code: "ID.AM-3", title: "Network communication and data flow mapping", description: "Representations of the organization's authorized network communication and internal/external data flows are maintained." },
        { code: "ID.AM-4", title: "Supplier services inventory", description: "Inventories of services provided by suppliers are maintained." },
      ],
    },
    {
      code: "ID.RA",
      title: "Identify: Risk Assessment",
      controls: [
        { code: "ID.RA-1", title: "Vulnerabilities identified", description: "Vulnerabilities in assets are identified, validated, and recorded." },
        { code: "ID.RA-2", title: "Threat intelligence received", description: "Cyber threat intelligence is received from information sharing forums and sources." },
        { code: "ID.RA-3", title: "Threats identified and recorded", description: "Internal and external threats to the organization are identified and recorded." },
        { code: "ID.RA-4", title: "Risk responses prioritized and tracked", description: "Potential impacts and likelihoods are used to determine risk, and risk responses are identified, prioritized, and tracked." },
      ],
    },
    {
      code: "ID.IM",
      title: "Identify: Improvement",
      controls: [
        { code: "ID.IM-1", title: "Improvements from evaluations", description: "Improvements are identified from evaluations of cybersecurity risk management activities." },
        { code: "ID.IM-2", title: "Improvements from tests and exercises", description: "Improvements are identified from security tests and exercises, including those done in coordination with suppliers and relevant third parties." },
        { code: "ID.IM-3", title: "Improvement plans tracked", description: "Improvement plans are established and tracked to closure." },
      ],
    },
    {
      code: "PR.AA",
      title: "Protect: Identity Management, Authentication, and Access Control",
      controls: [
        { code: "PR.AA-1", title: "Identities and credentials managed", description: "Identities and credentials for authorized users, services, and hardware are managed by the organization." },
        { code: "PR.AA-2", title: "Identity proofing", description: "Identities are proofed and bound to credentials based on the context of interactions." },
        { code: "PR.AA-3", title: "Authentication", description: "Users, services, and hardware are authenticated." },
        { code: "PR.AA-4", title: "Access permissions managed", description: "Access permissions, entitlements, and authorizations are managed, incorporating least privilege and separation of duties." },
        { code: "PR.AA-5", title: "Remote access managed", description: "Remote access is managed and monitored." },
      ],
    },
    {
      code: "PR.AT",
      title: "Protect: Awareness and Training",
      controls: [
        { code: "PR.AT-1", title: "General awareness and training", description: "Personnel are provided cybersecurity awareness and training so they can perform their cybersecurity-related tasks." },
        { code: "PR.AT-2", title: "Role-based training", description: "Individuals in specialized roles are provided cybersecurity awareness and training relevant to their role." },
      ],
    },
    {
      code: "PR.DS",
      title: "Protect: Data Security",
      controls: [
        { code: "PR.DS-1", title: "Data-at-rest protection", description: "The confidentiality, integrity, and availability of data at rest are protected." },
        { code: "PR.DS-2", title: "Data-in-transit protection", description: "The confidentiality, integrity, and availability of data in transit are protected." },
        { code: "PR.DS-3", title: "Backups managed", description: "Backups of data are created, protected, maintained, and tested." },
        { code: "PR.DS-4", title: "Data destruction", description: "Data is destroyed or sanitized according to policy when no longer needed." },
      ],
    },
    {
      code: "PR.PS",
      title: "Protect: Platform Security",
      controls: [
        { code: "PR.PS-1", title: "Configuration management", description: "Configuration management practices are established and applied to hardening baselines." },
        { code: "PR.PS-2", title: "Software maintenance", description: "Software is maintained, replaced, and removed commensurate with risk." },
        { code: "PR.PS-3", title: "Hardware maintenance", description: "Hardware is maintained, replaced, and removed commensurate with risk." },
        { code: "PR.PS-4", title: "Log generation", description: "Log records are generated and made available for continuous monitoring." },
        { code: "PR.PS-5", title: "Unauthorized software prevented", description: "Installation and execution of unauthorized software are prevented." },
      ],
    },
    {
      code: "PR.IR",
      title: "Protect: Technology Infrastructure Resilience",
      controls: [
        { code: "PR.IR-1", title: "Network protection", description: "Networks and environments are protected from unauthorized logical access and usage." },
        { code: "PR.IR-2", title: "Environmental threat protection", description: "The organization's technology assets are protected from environmental threats." },
        { code: "PR.IR-3", title: "Resilience mechanisms", description: "Mechanisms are implemented to achieve resilience requirements in normal and adverse situations." },
        { code: "PR.IR-4", title: "Adequate resource capacity", description: "Adequate resource capacity is maintained to ensure availability." },
      ],
    },
    {
      code: "DE.CM",
      title: "Detect: Continuous Monitoring",
      controls: [
        { code: "DE.CM-1", title: "Network monitoring", description: "Networks and network services are monitored to find potentially adverse events." },
        { code: "DE.CM-2", title: "Physical environment monitoring", description: "The physical environment is monitored to find potentially adverse events." },
        { code: "DE.CM-3", title: "Personnel activity monitoring", description: "Personnel activity and technology usage are monitored to find potentially adverse events." },
        { code: "DE.CM-4", title: "External provider monitoring", description: "External service provider activities and services are monitored to find potentially adverse events." },
      ],
    },
    {
      code: "DE.AE",
      title: "Detect: Adverse Event Analysis",
      controls: [
        { code: "DE.AE-1", title: "Anomalous activity analyzed", description: "Anomalous activity is analyzed to determine whether it represents a cybersecurity incident." },
        { code: "DE.AE-2", title: "Impact and scope understood", description: "The estimated impact and scope of adverse events are understood." },
        { code: "DE.AE-3", title: "Information correlated", description: "Information is correlated from multiple sources to establish and validate an incident." },
        { code: "DE.AE-4", title: "Alert thresholds established", description: "Incident alert thresholds are established and used to trigger response." },
      ],
    },
    {
      code: "RS.MA",
      title: "Respond: Incident Management",
      controls: [
        { code: "RS.MA-1", title: "Incident response plan executed", description: "The incident response plan is executed once an incident is declared, in coordination with relevant third parties." },
        { code: "RS.MA-2", title: "Incidents categorized and prioritized", description: "Incidents are categorized and prioritized." },
        { code: "RS.MA-3", title: "Response actions based on criteria", description: "Incident response actions are taken based on established criteria." },
        { code: "RS.MA-4", title: "Stakeholders informed", description: "Incident information and updates are shared with designated internal and external stakeholders." },
      ],
    },
    {
      code: "RS.AN",
      title: "Respond: Incident Analysis",
      controls: [
        { code: "RS.AN-1", title: "Root cause analysis", description: "Analysis is performed to establish what has taken place during an incident and its root cause." },
        { code: "RS.AN-2", title: "Incident status tracked", description: "Actions performed during an investigation are recorded and the incident's status is maintained." },
        { code: "RS.AN-3", title: "Incident data preserved", description: "Incident data and metadata are collected and their integrity and provenance preserved." },
      ],
    },
    {
      code: "RS.CO",
      title: "Respond: Incident Response Reporting and Communication",
      controls: [
        { code: "RS.CO-1", title: "Stakeholder notification", description: "Internal and external stakeholders are notified of incidents per applicable requirements." },
        { code: "RS.CO-2", title: "Information shared per response plans", description: "Incident information is shared with designated stakeholders per response plans and legal/regulatory requirements." },
      ],
    },
    {
      code: "RS.MI",
      title: "Respond: Incident Mitigation",
      controls: [
        { code: "RS.MI-1", title: "Incidents contained", description: "Incidents are contained to prevent expansion of the event." },
        { code: "RS.MI-2", title: "Incidents eradicated", description: "Incidents are eradicated, removing the threat from affected systems." },
      ],
    },
    {
      code: "RC.RP",
      title: "Recover: Recovery Planning",
      controls: [
        { code: "RC.RP-1", title: "Recovery plan executed", description: "The recovery portion of the incident response plan is executed once initiated." },
        { code: "RC.RP-2", title: "Recovery actions selected and performed", description: "Recovery actions are selected, scoped, prioritized, and performed." },
        { code: "RC.RP-3", title: "Restored asset integrity verified", description: "The integrity of restored assets is verified, systems are sanitized, and normal operating status is confirmed before returning to normal operations." },
      ],
    },
    {
      code: "RC.CO",
      title: "Recover: Coordination",
      controls: [
        { code: "RC.CO-1", title: "Recovery activities communicated", description: "Recovery activities and progress are communicated to designated internal and external stakeholders." },
        { code: "RC.CO-2", title: "Reputation management", description: "Public relations and reputation repair after an incident are managed as needed." },
      ],
    },
  ],
};
