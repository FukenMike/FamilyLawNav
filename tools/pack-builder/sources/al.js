/**
 * Alabama FAMILY LAW source pack starter. Link-first, family-law only. Expand over time.
 */

module.exports = {
  domains: [
    { id: "divorce", label: "Divorce" },
    { id: "custody", label: "Custody & Visitation" },
    { id: "support", label: "Child Support" },
    { id: "paternity", label: "Paternity" },
    { id: "protection_orders", label: "Protection Orders (DV)" },
    { id: "procedure", label: "Procedure" },
    { id: "service_notice", label: "Service & Notice" },
    { id: "enforcement", label: "Enforcement & Contempt" },
  ],

  issues: [
    { id: "divorce_grounds", label: "Grounds for divorce", domainId: "divorce" },
    { id: "divorce_property", label: "Property division / alimony basics", domainId: "divorce" },

    { id: "custody_best_interest", label: "Best-interest factors", domainId: "custody" },
    { id: "custody_modification", label: "Modification / relocation", domainId: "custody" },

    { id: "support_guidelines", label: "Guidelines / worksheets", domainId: "support" },
    { id: "support_deviation", label: "Deviation / imputation", domainId: "support" },

    { id: "paternity_establish", label: "Establishing paternity", domainId: "paternity" },

    { id: "pfa_process", label: "PFA filing + hearing process", domainId: "protection_orders" },

    { id: "service_rules", label: "Service rules + alternative service", domainId: "service_notice" },
    { id: "appeals_deadlines", label: "Appeals + key deadlines", domainId: "procedure" },

    { id: "contempt", label: "Contempt / enforcement remedies", domainId: "enforcement" },
  ],

  authorities: [
    // Statutes
    {
      id: "al-divorce-grounds",
      kind: "statute",
      citation: "Ala. Code § 30-2-1",
      title: "Grounds for divorce",
      source_url: "https://alisondb.legislature.state.al.us",
      short_summary: "Lists statutory grounds for divorce.",
      domains: ["divorce"],
      issues: ["divorce_grounds"],
    },
    {
      id: "al-custody-general",
      kind: "statute",
      citation: "Ala. Code (Custody/visitation provisions)",
      title: "Custody & visitation general provisions",
      source_url: "https://alisondb.legislature.state.al.us",
      short_summary: "Starting point for AL custody/visitation statutes (replace with specific sections).",
      domains: ["custody"],
      issues: ["custody_best_interest"],
    },
    {
      id: "al-support-guidelines",
      kind: "rule",
      citation: "Alabama Rules of Judicial Administration (Child Support Guidelines)",
      title: "Child Support Guidelines / worksheets",
      source_url: "",
      short_summary: "Guidelines authority for calculating child support (link to official PDF/page).",
      domains: ["support"],
      issues: ["support_guidelines"],
    },
    {
      id: "al-paternity",
      kind: "statute",
      citation: "Ala. Code (Uniform Parentage / paternity provisions)",
      title: "Paternity / parentage",
      source_url: "https://alisondb.legislature.state.al.us",
      short_summary: "Starting point for AL parentage statutes (replace with specific sections).",
      domains: ["paternity"],
      issues: ["paternity_establish"],
    },
    {
      id: "al-pfa",
      kind: "statute",
      citation: "Ala. Code (Protection From Abuse Act)",
      title: "Protection from Abuse (PFA) process",
      source_url: "https://alisondb.legislature.state.al.us",
      short_summary: "Statutory basis for PFA petitions, hearings, and relief.",
      domains: ["protection_orders"],
      issues: ["pfa_process"],
    },

    // Procedure + service
    {
      id: "al-service-rules",
      kind: "rule",
      citation: "Alabama Rules of Civil Procedure (Service)",
      title: "Service of process rules",
      source_url: "",
      short_summary: "Service requirements and alternative service options.",
      domains: ["service_notice"],
      issues: ["service_rules"],
    },
    {
      id: "al-appeals",
      kind: "rule",
      citation: "Alabama Rules of Appellate Procedure",
      title: "Appeals & deadlines",
      source_url: "",
      short_summary: "Appellate deadlines and procedures (link official rules).",
      domains: ["procedure"],
      issues: ["appeals_deadlines"],
    },

    // Forms/self-help
    {
      id: "al-divorce-forms",
      kind: "form",
      citation: "Alabama court forms",
      title: "Divorce / custody / support forms (official)",
      source_url: "",
      short_summary: "Official or widely-used court forms/self-help portal.",
      domains: ["divorce", "custody", "support"],
      issues: ["divorce_grounds", "custody_best_interest", "support_guidelines"],
    },

    // Enforcement
    {
      id: "al-contempt",
      kind: "guide",
      citation: "AL enforcement / contempt overview",
      title: "Enforcement & contempt basics",
      source_url: "",
      short_summary: "High-level enforcement entrypoint (replace with official guidance/court resources).",
      domains: ["enforcement"],
      issues: ["contempt"],
    },
  ],
};
