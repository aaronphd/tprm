import type { FrameworkSeed } from "./types";
import { CMMI_STYLE_MATURITY } from "./maturity-models";

// Source: AICPA Trust Services Criteria (2017, with 2022 points-of-focus updates).
// Control text is paraphrased for assessment purposes. Verify against current AICPA
// guidance before audit fieldwork.
export const soc2: FrameworkSeed = {
  slug: "soc2",
  name: "SOC 2",
  version: "2017 (2022 revision)",
  description:
    "AICPA Trust Services Criteria readiness assessment. Common Criteria (CC1-CC9) plus the optional Availability, Confidentiality, and Privacy categories. Mark a category's controls Not Applicable if that category is out of scope for the engagement.",
  maturityModel: CMMI_STYLE_MATURITY,
  domains: [
    {
      code: "CC1",
      title: "Control Environment",
      controls: [
        { code: "CC1.1", title: "Commitment to integrity and ethical values", description: "A code of conduct / ethics policy exists and is communicated, with a mechanism for reporting violations and board/management tone-at-the-top." },
        { code: "CC1.2", title: "Board oversight structure", description: "Management establishes, with board oversight, structures, reporting lines, and appropriate authorities and responsibilities, including a defined security function." },
        { code: "CC1.3", title: "Competent personnel", description: "The entity attracts, develops, and retains competent individuals aligned with security objectives, including defined competency requirements and pre-hire background checks." },
        { code: "CC1.4", title: "Accountability for control responsibilities", description: "Individuals are held accountable for their internal control responsibilities via performance evaluations and a disciplinary process for policy violations." },
        { code: "CC1.5", title: "Board independence and oversight", description: "The board (or a designated committee) demonstrates independence from management and exercises oversight of the security control environment." },
      ],
    },
    {
      code: "CC2",
      title: "Communication and Information",
      controls: [
        { code: "CC2.1", title: "Quality information supporting controls", description: "The entity obtains or generates relevant, quality information (metrics, scan reports, access review outputs) to support the functioning of internal control." },
        { code: "CC2.2", title: "Internal communication of security objectives", description: "Security policies, objectives, and responsibilities are communicated internally, supported by a security awareness training program." },
        { code: "CC2.3", title: "External communication", description: "The entity communicates with external parties regarding security matters, including contractual security commitments and a tested breach notification process." },
      ],
    },
    {
      code: "CC3",
      title: "Risk Assessment",
      controls: [
        { code: "CC3.1", title: "Objectives specified with clarity", description: "Security objectives are defined, documented, and aligned with business objectives." },
        { code: "CC3.2", title: "Risk identification and analysis", description: "A formal risk assessment process exists; a risk register is maintained and reviewed, with assessments performed at least annually." },
        { code: "CC3.3", title: "Fraud risk considered", description: "Fraud risk is considered in the risk assessment, with access controls designed to prevent unauthorized transactions." },
        { code: "CC3.4", title: "Change-driven risk identification", description: "The entity identifies and assesses changes (new systems, vendors, business changes) that could significantly impact the control environment." },
      ],
    },
    {
      code: "CC4",
      title: "Monitoring Activities",
      controls: [
        { code: "CC4.1", title: "Ongoing and separate evaluations", description: "Ongoing monitoring of security controls occurs, supplemented by periodic independent review or assessment (internal audit, pen test)." },
        { code: "CC4.2", title: "Timely communication of deficiencies", description: "Control deficiencies are tracked and communicated in a timely manner to management and the board for corrective action." },
      ],
    },
    {
      code: "CC5",
      title: "Control Activities",
      controls: [
        { code: "CC5.1", title: "Risk-based control selection", description: "Control activities are selected and developed based on the risk assessment and mapped to identified risks." },
        { code: "CC5.2", title: "Technology general controls", description: "General controls over technology (MFA, encryption, logging) are implemented and documented." },
        { code: "CC5.3", title: "Policies and procedures deployment", description: "Control activities are deployed through documented policies and operational procedures, reviewed and updated periodically." },
      ],
    },
    {
      code: "CC6",
      title: "Logical and Physical Access Controls",
      controls: [
        { code: "CC6.1", title: "Logical access security software and architecture", description: "Logical access security software, infrastructure, and architecture protect information assets, including RBAC and least-privilege enforcement." },
        { code: "CC6.2", title: "User registration and authorization", description: "New internal and external users are registered and authorized prior to being issued system credentials, with approval-based provisioning." },
        { code: "CC6.3", title: "Access modification and removal", description: "Access to data, software, functions, and other protected assets is authorized, modified, or removed based on approved access requests, including a deprovisioning process for departures." },
        { code: "CC6.4", title: "Physical access restriction", description: "Physical access to facilities and protected assets (data centers, backup media storage) is restricted to authorized personnel, with a visitor log and badge/lock controls." },
        { code: "CC6.5", title: "Access discontinued on termination", description: "Logical and physical access is discontinued upon termination or change in job function, with same-day revocation." },
        { code: "CC6.6", title: "Perimeter and external threat protection", description: "Logical access security measures (firewall, IDS/IPS, WAF) protect against threats from outside the system boundary." },
        { code: "CC6.7", title: "Data transmission and disposal protection", description: "Transmission, movement, and removal of information is restricted to authorized users and protected in transit and at disposal (TLS, DLP, media disposal process)." },
        { code: "CC6.8", title: "Malicious software prevention", description: "Controls prevent, detect, and act upon the introduction of unauthorized or malicious software (EDR/AV, anti-phishing)." },
      ],
    },
    {
      code: "CC7",
      title: "System Operations",
      controls: [
        { code: "CC7.1", title: "Vulnerability detection and monitoring", description: "Detection and monitoring procedures identify configuration changes introducing vulnerabilities and susceptibility to newly discovered ones (vulnerability scanning, patch management)." },
        { code: "CC7.2", title: "Anomaly monitoring and analysis", description: "System components are monitored for anomalies indicative of malicious acts or errors, with a SIEM/logging and event-triage process." },
        { code: "CC7.3", title: "Security event evaluation", description: "Security events are evaluated to determine whether they constitute a security incident, using documented classification criteria." },
        { code: "CC7.4", title: "Incident response execution", description: "A defined incident response program is executed to understand, contain, remediate, and recover from incidents, tested via tabletop exercises." },
        { code: "CC7.5", title: "Incident recovery", description: "Recovery procedures from identified security incidents are developed, implemented, and tested, feeding a lessons-learned process." },
      ],
    },
    {
      code: "CC8",
      title: "Change Management",
      controls: [
        { code: "CC8.1", title: "Change management process", description: "Changes to infrastructure, data, software, and procedures are authorized, designed, tested, approved, and implemented via a formal change management process, including code review." },
      ],
    },
    {
      code: "CC9",
      title: "Risk Mitigation",
      controls: [
        { code: "CC9.1", title: "Business disruption risk mitigation", description: "Risk mitigation activities address risks arising from potential business disruptions, informed by a business continuity plan." },
        { code: "CC9.2", title: "Vendor and business partner risk management", description: "Risks associated with vendors and business partners are assessed and managed, including pre-onboarding and annual reviews of critical vendors." },
      ],
    },
    {
      code: "A1",
      title: "Availability",
      controls: [
        { code: "A1.1", title: "Capacity monitoring and planning", description: "Current processing capacity and usage are monitored against availability commitments, with a capacity planning process." },
        { code: "A1.2", title: "Backup and recovery infrastructure", description: "Environmental protections, backup processes, and recovery infrastructure are designed and operated to meet availability commitments, with defined RTO/RPO." },
        { code: "A1.3", title: "Recovery plan testing", description: "Recovery plan procedures supporting system recovery are tested within the observation period, with gaps remediated." },
      ],
    },
    {
      code: "C1",
      title: "Confidentiality",
      controls: [
        { code: "C1.1", title: "Confidential information identification", description: "Confidential information is identified, classified, and maintained per a data classification policy." },
        { code: "C1.2", title: "Confidential information disposal", description: "Confidential information is disposed of securely per a data retention and deletion policy." },
      ],
    },
    {
      code: "P",
      title: "Privacy",
      controls: [
        { code: "P1.0", title: "Privacy notice", description: "A privacy notice describes how personal information is collected, used, retained, and disclosed." },
        { code: "P2.0", title: "Choice and consent", description: "Individuals are provided choice and consent mechanisms (opt-in/opt-out) for the collection, use, and disclosure of personal information." },
        { code: "P3.0", title: "Collection limited to purpose", description: "Personal information collection is limited to what is identified in the privacy notice and necessary for the stated purpose." },
        { code: "P4.0", title: "Use, retention, and disposal limits", description: "Personal information use is limited to identified purposes, with a defined retention schedule and disposal process." },
        { code: "P5.0", title: "Access for data subjects", description: "Individuals are provided access to their personal information for review and, where appropriate, update or correction." },
        { code: "P6.0", title: "Disclosure and notification", description: "Personal information is disclosed to third parties only per commitments in the privacy notice, with breach notification procedures in place." },
        { code: "P7.0", title: "Quality of personal information", description: "Personal information is maintained accurately and completely for its intended use." },
        { code: "P8.0", title: "Privacy program monitoring and enforcement", description: "The privacy program is monitored for compliance with commitments, with a process for handling privacy-related inquiries, complaints, and disputes." },
      ],
    },
  ],
};
