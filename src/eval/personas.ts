/** Ten personas for the M0 model eval (SPEC §12): sizes, reach, leanings, legal forms and "Other" answers. */
export const PERSONAS = [
  {
    id: "riverside",
    question: "Members want to vote on what tools to buy and see where the money goes.",
    profile: { name: "Riverside Tool Library", purpose: "Lend tools to neighbours", scale: "team", reach: "local", decision: "consensus",
      leans: { speedSay: 4, stableAdapt: 4, autoJudge: 2 }, limits: ["crypto", "cost", "server"], setup: "none", legal: "informal" },
  },
  {
    id: "repair-network",
    question: "Several repair cafés want to share volunteer schedules without one group owning the data.",
    profile: { name: "Eastside Repair Café Network", purpose: "Fix things instead of binning them", scale: "teams", reach: "regional", decision: "roles",
      leans: { speedSay: 3, stableAdapt: 4, autoJudge: 2 }, limits: ["mobile", "export"], setup: "guided", legal: "nonprofit" },
  },
  {
    id: "solo-researcher",
    question: "I want to keep research notes that sync between my laptop and phone and work offline.",
    profile: { name: "Field notes", purpose: "Ethnographic research", scale: "solo", reach: "online", decision: "single",
      leans: { speedSay: 1, stableAdapt: 3, autoJudge: 3 }, limits: ["offline", "export"], setup: "developer", legal: "informal" },
  },
  {
    id: "housing-coop",
    question: "How can residents propose and approve house rule changes between meetings?",
    profile: { name: "Maple Housing Co-op", purpose: "Affordable shared housing", scale: "community", reach: "members", decision: "vote",
      leans: { speedSay: 5, stableAdapt: 2, autoJudge: 2 }, limits: ["crypto"], setup: "none", legal: "coop" },
  },
  {
    id: "grants-dao",
    question: "Contributors want a transparent way to allocate a grants budget and track payouts on-chain.",
    profile: { name: "Commons Grants Circle", purpose: "Fund open-source public goods", scale: "network", reach: "global", decision: "vote",
      leans: { speedSay: 4, stableAdapt: 4, autoJudge: 5 }, limits: [], setup: "developer", legal: "other",
      other: { legal: "Wyoming DAO LLC in progress" } },
  },
  {
    id: "mutual-aid",
    question: "People need to ask for help privately and get matched with neighbours who can offer it.",
    profile: { name: "Northside Mutual Aid", purpose: "Neighbours helping neighbours", scale: "community", reach: "local", decision: "unsettled",
      leans: { speedSay: 3, stableAdapt: 5, autoJudge: 1 }, limits: ["cost", "mobile"], setup: "none", legal: "informal" },
  },
  {
    id: "worker-coop",
    question: "We want profit-sharing decisions to be recorded and auditable by every worker-owner.",
    profile: { name: "Loom Studio", purpose: "Design worker co-op", scale: "team", reach: "national", decision: "other",
      other: { decision: "Sociocracy circles with a general meeting for big decisions" },
      leans: { speedSay: 4, stableAdapt: 3, autoJudge: 3 }, limits: ["server"], setup: "guided", legal: "coop" },
  },
  {
    id: "festival",
    question: "Volunteers need to coordinate shifts at a festival site with no internet.",
    profile: { name: "Fieldsong Festival crew", purpose: "Run a three-day music festival", scale: "teams", reach: "local", decision: "board",
      leans: { speedSay: 2, stableAdapt: 2, autoJudge: 3 }, limits: ["offline", "mobile"], setup: "other",
      other: { setup: "One volunteer can run a Raspberry Pi" }, legal: "nonprofit" },
  },
  {
    id: "seed-library",
    question: "A seed-saving network wants a shared catalogue that any member group can host a copy of.",
    profile: { name: "Open Seed Commons", purpose: "Keep heirloom seeds in circulation", scale: "network", reach: "other",
      other: { reach: "Members in four countries, mostly rural" },
      leans: { speedSay: 4, stableAdapt: 4, autoJudge: 2 }, limits: ["crypto", "export"], setup: "guided", legal: "unsure" },
  },
  {
    id: "startup-team",
    question: "Our small company wants an internal knowledge base employees can take with them if they leave.",
    profile: { name: "Brightline", purpose: "Climate data consultancy", scale: "team", reach: "national", decision: "single",
      leans: { speedSay: 1, stableAdapt: 3, autoJudge: 4 }, limits: ["export"], setup: "developer", legal: "company" },
  },
] as const;
