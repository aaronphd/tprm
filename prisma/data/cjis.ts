import type { FrameworkSeed } from "./types";
import { CMMI_STYLE_MATURITY } from "./maturity-models";

// Structure verified via web search against current FBI CJIS publications (Aug 2026):
// CJIS Security Policy v6.1 (published 2026-06-25) restructured the policy from the
// older 13 policy areas (v5.9.x) onto 20 policy areas — Area 1 is Information Exchange
// Agreements, Areas 2-19 are the 18 NIST SP 800-53 Rev 5 control families in their
// standard order, and Area 20 is Mobile Devices. Domain codes/titles below follow that
// verified structure. The controls *within* each policy area are a representative set
// built from general knowledge of CJIS-specific requirements (advanced authentication,
// FIPS-validated cryptography, fingerprint-based background checks, etc.) rather than a
// verified line-by-line reading of the full v6.1 text — validate against the licensed
// policy before formal audit prep. Note: per FBI CJIS guidance, audits through
// 2027-03-31 are still conducted against v5.9.5, not v6.1 — confirm which version your
// CSA (CJIS Systems Agency) is auditing against before scoping an assessment.
export const cjis: FrameworkSeed = {
  slug: "cjis",
  name: "CJIS Security Policy",
  version: "6.1 (June 2026)",
  description:
    "FBI Criminal Justice Information Services (CJIS) Security Policy readiness assessment, structured on the 20 policy areas introduced in v6.0/6.1 (Area 1: Information Exchange Agreements; Areas 2-19: the 18 NIST SP 800-53 control families; Area 20: Mobile Devices). Applies to any agency or vendor with access to Criminal Justice Information (CJI). Audits through 2027-03-31 are still conducted against the prior v5.9.5 — confirm which version applies before scoping.",
  maturityModel: CMMI_STYLE_MATURITY,
  domains: [
    {
      code: "PA1",
      title: "Information Exchange Agreements",
      controls: [
        { code: "PA1.1", title: "CJI exchange agreements", description: "Written agreements (MOU/ISA) govern the exchange of Criminal Justice Information between agencies, contractors, and vendors." },
        { code: "PA1.2", title: "CJIS Security Addendum for vendors/contractors", description: "Any contractor or vendor with access to CJI executes the CJIS Security Addendum and is bound by its terms." },
      ],
    },
    {
      code: "PA2",
      title: "Access Control (AC)",
      controls: [
        { code: "PA2.1", title: "Least privilege", description: "Access to CJI and CJI systems is restricted to the minimum necessary for each user's role." },
        { code: "PA2.2", title: "Account management", description: "CJI system accounts are provisioned, reviewed periodically, and deprovisioned promptly on termination or role change." },
        { code: "PA2.3", title: "Advanced authentication (MFA)", description: "Multi-factor authentication is required for all access — local and remote — to systems that process, store, or transmit CJI." },
        { code: "PA2.4", title: "Session lock", description: "Sessions accessing CJI automatically lock or terminate after a defined period of inactivity." },
        { code: "PA2.5", title: "Remote access control", description: "Remote access to CJI systems is authorized, encrypted, and monitored." },
      ],
    },
    {
      code: "PA3",
      title: "Awareness and Training (AT)",
      controls: [
        { code: "PA3.1", title: "Security awareness training", description: "Personnel complete CJIS security awareness training (Level 1 or 2, as applicable) before access to CJI and annually thereafter." },
        { code: "PA3.2", title: "Role-based training", description: "Personnel with privileged or system administration duties over CJI systems receive role-based security training." },
        { code: "PA3.3", title: "Insider threat awareness", description: "Training includes insider threat awareness and reporting expectations." },
      ],
    },
    {
      code: "PA4",
      title: "Audit and Accountability (AU)",
      controls: [
        { code: "PA4.1", title: "Auditable events", description: "CJI systems generate audit logs for a defined set of security-relevant events (logon, access, changes to permissions, etc.)." },
        { code: "PA4.2", title: "Audit log retention", description: "Audit logs are retained for at least the minimum period required by the CJIS Security Policy." },
        { code: "PA4.3", title: "Audit review and reporting", description: "Audit logs are regularly reviewed and analyzed for indications of inappropriate or unusual activity." },
        { code: "PA4.4", title: "Protection of audit information", description: "Audit logs and audit tools are protected from unauthorized access, modification, and deletion." },
      ],
    },
    {
      code: "PA5",
      title: "Assessment, Authorization, and Monitoring (CA)",
      controls: [
        { code: "PA5.1", title: "Security control assessments", description: "Security controls protecting CJI systems are assessed on a periodic basis for effectiveness." },
        { code: "PA5.2", title: "Continuous monitoring", description: "A continuous monitoring program tracks the security state of CJI systems between formal assessments." },
        { code: "PA5.3", title: "Plan of Action and Milestones", description: "Identified deficiencies are tracked to remediation via a documented POA&M." },
      ],
    },
    {
      code: "PA6",
      title: "Configuration Management (CM)",
      controls: [
        { code: "PA6.1", title: "Baseline configuration", description: "A current baseline configuration is established and maintained for CJI systems." },
        { code: "PA6.2", title: "Change control", description: "Changes to CJI systems are documented, reviewed, tested, and approved before implementation." },
        { code: "PA6.3", title: "Least functionality", description: "CJI systems are configured to provide only essential capabilities, with unnecessary services, ports, and protocols disabled." },
        { code: "PA6.4", title: "System component inventory", description: "An inventory of hardware, software, and firmware components for CJI systems is maintained." },
      ],
    },
    {
      code: "PA7",
      title: "Contingency Planning (CP)",
      controls: [
        { code: "PA7.1", title: "Contingency plan", description: "A documented contingency/disaster recovery plan covers CJI systems." },
        { code: "PA7.2", title: "Backup", description: "CJI data is backed up on a defined schedule and backups are tested for restorability." },
        { code: "PA7.3", title: "Alternate storage/processing", description: "An alternate storage or processing site is identified for critical CJI systems." },
      ],
    },
    {
      code: "PA8",
      title: "Identification and Authentication (IA)",
      controls: [
        { code: "PA8.1", title: "Unique identification", description: "Each user of a CJI system is uniquely identified; shared or generic accounts are not used for CJI access." },
        { code: "PA8.2", title: "Authenticator management", description: "Passwords, tokens, or other authenticators are issued, changed, and protected per a documented policy." },
        { code: "PA8.3", title: "Device identification and authentication", description: "Devices connecting to CJI systems are uniquely identified and authenticated before establishing a connection." },
        { code: "PA8.4", title: "Identity proofing", description: "Identity is verified before an authenticator is issued or a credential is bound to an individual." },
      ],
    },
    {
      code: "PA9",
      title: "Incident Response (IR)",
      controls: [
        { code: "PA9.1", title: "Incident response plan", description: "A documented incident response plan covers security incidents affecting CJI systems." },
        { code: "PA9.2", title: "Incident reporting to the CSA", description: "Security incidents involving CJI are reported to the CJIS Systems Agency / FBI CJIS Division within the required timeframe." },
        { code: "PA9.3", title: "Incident handling", description: "The organization can detect, contain, eradicate, and recover from security incidents affecting CJI systems." },
        { code: "PA9.4", title: "Incident response testing", description: "The incident response plan is tested (e.g., tabletop exercise) on a periodic basis." },
      ],
    },
    {
      code: "PA10",
      title: "Maintenance (MA)",
      controls: [
        { code: "PA10.1", title: "Controlled maintenance", description: "Maintenance on CJI systems is scheduled, performed, and logged per a documented process." },
        { code: "PA10.2", title: "Remote maintenance", description: "Remote maintenance sessions on CJI systems are approved, authenticated, and logged." },
      ],
    },
    {
      code: "PA11",
      title: "Media Protection (MP)",
      controls: [
        { code: "PA11.1", title: "Media access", description: "Access to digital and physical media containing CJI is restricted to authorized individuals." },
        { code: "PA11.2", title: "Media marking", description: "Media containing CJI is marked or labeled per its sensitivity." },
        { code: "PA11.3", title: "Media sanitization", description: "Media is sanitized or destroyed before disposal or reuse per a documented process." },
        { code: "PA11.4", title: "Media transport", description: "Media containing CJI is protected (encryption and/or physical control) during transport outside controlled areas." },
      ],
    },
    {
      code: "PA12",
      title: "Physical and Environmental Protection (PE)",
      controls: [
        { code: "PA12.1", title: "Physical access authorizations", description: "A list of personnel authorized for physical access to CJI facilities/areas is maintained and kept current." },
        { code: "PA12.2", title: "Physical access control", description: "Physical access to CJI facilities is controlled (locks, badges, escorted visitors) and enforced." },
        { code: "PA12.3", title: "Physical access monitoring", description: "Physical access to CJI facilities is monitored and access attempts are logged." },
        { code: "PA12.4", title: "Environmental controls", description: "Fire, power, and temperature/humidity controls protect CJI processing facilities and equipment." },
      ],
    },
    {
      code: "PA13",
      title: "Planning (PL)",
      controls: [
        { code: "PA13.1", title: "System security plan", description: "A system security plan documents the security controls protecting each CJI system." },
        { code: "PA13.2", title: "Rules of behavior", description: "Rules of behavior for CJI system users are defined and formally acknowledged before access is granted." },
      ],
    },
    {
      code: "PA14",
      title: "Personnel Security (PS)",
      controls: [
        { code: "PA14.1", title: "Fingerprint-based background check", description: "A fingerprint-based state and national background check is completed before an individual is granted unescorted access to CJI." },
        { code: "PA14.2", title: "Personnel screening", description: "Personnel with access to CJI are re-screened on a periodic basis per agency policy." },
        { code: "PA14.3", title: "Personnel termination", description: "Access to CJI systems is revoked the same day as an individual's termination." },
        { code: "PA14.4", title: "Personnel transfer", description: "Access rights are reviewed and adjusted when an individual changes roles or responsibilities." },
      ],
    },
    {
      code: "PA15",
      title: "Risk Assessment (RA)",
      controls: [
        { code: "PA15.1", title: "Risk assessment", description: "A risk assessment identifying threats and vulnerabilities to CJI systems is performed and kept current." },
        { code: "PA15.2", title: "Vulnerability scanning", description: "CJI systems are scanned for vulnerabilities on a regular schedule and findings are tracked to remediation." },
        { code: "PA15.3", title: "Risk assessment updates", description: "The risk assessment is updated whenever a significant change occurs to a CJI system or its environment." },
      ],
    },
    {
      code: "PA16",
      title: "System and Services Acquisition (SA)",
      controls: [
        { code: "PA16.1", title: "Security in acquisition", description: "Security requirements are included in the acquisition of systems and services that will process, store, or transmit CJI." },
        { code: "PA16.2", title: "CJIS Security Addendum flow-down", description: "CJIS Security Addendum requirements are flowed down to subcontractors and vendors with CJI access." },
        { code: "PA16.3", title: "Development lifecycle security", description: "Security is addressed throughout the development lifecycle of systems that handle CJI." },
      ],
    },
    {
      code: "PA17",
      title: "System and Communications Protection (SC)",
      controls: [
        { code: "PA17.1", title: "Boundary protection", description: "Firewalls and other boundary protection mechanisms control traffic into and out of networks carrying CJI." },
        { code: "PA17.2", title: "Encryption in transit", description: "CJI transmitted over any network is protected using FIPS-validated cryptography." },
        { code: "PA17.3", title: "Encryption at rest", description: "CJI at rest is encrypted using FIPS-validated cryptography, particularly on mobile and removable media." },
        { code: "PA17.4", title: "Network segmentation", description: "Networks carrying CJI are segmented from general-purpose or lower-trust networks." },
        { code: "PA17.5", title: "Cloud hosting approval", description: "Cloud hosting of CJI is only used with the required CSA / FBI CJIS Division approval and a compliant service agreement." },
      ],
    },
    {
      code: "PA18",
      title: "System and Information Integrity (SI)",
      controls: [
        { code: "PA18.1", title: "Flaw remediation", description: "Security patches for CJI systems are identified, tested, and applied within a defined timeframe." },
        { code: "PA18.2", title: "Malicious code protection", description: "Malware protection is deployed on CJI systems and kept current." },
        { code: "PA18.3", title: "System monitoring", description: "CJI systems and networks are monitored for indicators of compromise or unauthorized activity." },
        { code: "PA18.4", title: "Security alerts and advisories", description: "Security alerts and advisories relevant to CJI systems are monitored and acted upon." },
      ],
    },
    {
      code: "PA19",
      title: "Supply Chain Risk Management (SR)",
      controls: [
        { code: "PA19.1", title: "Supply chain risk management plan", description: "A supply chain risk management plan addresses risk from components and services used in CJI systems." },
        { code: "PA19.2", title: "Supplier risk assessment", description: "Suppliers and vendors are assessed for security risk before being onboarded for CJI-related products or services." },
      ],
    },
    {
      code: "PA20",
      title: "Mobile Devices",
      controls: [
        { code: "PA20.1", title: "Mobile device management", description: "Mobile devices that access CJI are enrolled in a mobile device management (MDM) solution." },
        { code: "PA20.2", title: "Mobile device encryption", description: "Mobile devices accessing CJI use full-device or container encryption." },
        { code: "PA20.3", title: "Remote wipe", description: "Lost or stolen mobile devices with CJI access can be remotely wiped." },
        { code: "PA20.4", title: "Mobile device authentication", description: "Mobile devices require local device authentication plus advanced authentication before CJI can be accessed." },
      ],
    },
  ],
};
