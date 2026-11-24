import type { Limit, OtherField, Profile } from "../../src/shared/schema";

/** Onboarding questions, copy from the approved mockups (Main.dc.html). */
export type ChoiceQ = {
  step: number;
  field: "scale" | "reach" | "decision" | "setup" | "legal";
  title: string;
  help: string;
  otherHint: string;
  opts: { value: string; label: string; sub?: string }[];
};

export const CHOICES: Record<number, ChoiceQ> = {
  2: { step: 2, field: "scale", title: "How many people do the work?", help: "Count the people actively involved, not the people you serve.", otherHint: "e.g. 3 staff and about 40 volunteers",
    opts: [{ value: "solo", label: "Just me" }, { value: "team", label: "2 to 10" }, { value: "teams", label: "10 to 50" }, { value: "community", label: "50 to 500" }, { value: "network", label: "More than 500, or several groups" }] },
  3: { step: 3, field: "reach", title: "Who benefits from it?", help: "Some tools and ways of funding only work at a certain size.", otherHint: "e.g. tenants of one building",
    opts: [{ value: "members", label: "Only its own members" }, { value: "local", label: "One neighbourhood or town" }, { value: "regional", label: "A city or region" }, { value: "national", label: "A whole country" }, { value: "global", label: "People in several countries" }, { value: "online", label: "People online, anywhere" }] },
  4: { step: 4, field: "decision", title: "How are decisions made today?", help: "Tools are matched to the way your group already works.", otherHint: "e.g. a monthly meeting votes on anything over $100",
    opts: [{ value: "single", label: "One person decides" }, { value: "consensus", label: "Discussion until everyone agrees" }, { value: "vote", label: "A vote" }, { value: "roles", label: "Each role decides its own area" }, { value: "board", label: "A board decides" }, { value: "unsettled", label: "It isn't settled yet" }] },
  7: { step: 7, field: "setup", title: "Who will set it up?", help: "Some tools work straight away. Others need a developer.", otherHint: "e.g. a volunteer who manages our website",
    opts: [{ value: "none", label: "No one technical", sub: "It has to work straight away" }, { value: "guided", label: "Someone who can follow a guide", sub: "An afternoon of setup is fine" }, { value: "developer", label: "A developer", sub: "Can build on an existing tool" }] },
  8: { step: 8, field: "legal", title: "Is your group a legal organization?", help: "This decides who can hold shared money and sign agreements.", otherHint: "e.g. a project hosted by another charity",
    opts: [{ value: "informal", label: "No, it's informal" }, { value: "nonprofit", label: "Nonprofit or charity" }, { value: "coop", label: "Co-op" }, { value: "company", label: "Company" }, { value: "unsure", label: "Not sure" }] },
};

export const LIMIT_OPTS: { value: Limit; label: string }[] = [
  { value: "crypto", label: "Needs crypto or tokens" },
  { value: "cost", label: "Costs money" },
  { value: "server", label: "Needs a server to run" },
  { value: "mobile", label: "No phone app" },
  { value: "offline", label: "Fails on poor internet" },
  { value: "export", label: "Data can't be exported" },
];

export const SCALES = [
  { key: "speedSay", left: "Quick decisions by a few", right: "Everyone has a say, even if slower" },
  { key: "stableAdapt", left: "Rules that stay put", right: "Rules that change as you learn" },
  { key: "autoJudge", left: "Software enforces the rules", right: "People use judgement" },
] as const;

export const EXAMPLES = [
  "How can our volunteers keep shared notes that stay ours if we change apps?",
  "What could we use to split grant money fairly between our project teams?",
  "How do we move our members off a Facebook group without losing anyone?",
];

export type Answers = {
  purpose: string;
  scale?: string;
  reach?: string;
  decision?: string;
  leans: { speedSay: number; stableAdapt: number; autoJudge: number };
  leanNote: string;
  limits: Limit[];
  limitsOther: boolean;
  setup?: string;
  legal?: string;
  other: Partial<Record<OtherField, string>>;
  question: string;
  name: string;
};

export const emptyAnswers = (): Answers => ({
  purpose: "",
  leans: { speedSay: 3, stableAdapt: 3, autoJudge: 3 },
  leanNote: "",
  limits: [],
  limitsOther: false,
  other: {},
  question: "",
  name: "",
});

export function toProfile(a: Answers): Profile {
  const other: Partial<Record<OtherField, string>> = {};
  for (const f of ["scale", "reach", "decision", "setup", "legal"] as const) if (a[f] === "other" && a.other[f]?.trim()) other[f] = a.other[f]!.trim().slice(0, 280);
  if (a.limitsOther && a.other.limits?.trim()) other.limits = a.other.limits.trim().slice(0, 280);
  return {
    name: a.name.trim().slice(0, 80) || "My group",
    purpose: a.purpose.trim().slice(0, 500),
    scale: (a.scale ?? "other") as Profile["scale"],
    reach: (a.reach ?? "other") as Profile["reach"],
    decision: (a.decision ?? "other") as Profile["decision"],
    leans: a.leans,
    leanNote: a.leanNote.trim() ? a.leanNote.trim().slice(0, 280) : undefined,
    limits: a.limits,
    setup: (a.setup ?? "other") as Profile["setup"],
    legal: (a.legal ?? "other") as Profile["legal"],
    other,
  };
}

/** The in-progress draft of a new group's answers. Saved groups live in the workspace agent. */
const KEY = "gw.draft";
export const storage = {
  load(): Answers | null {
    try { const v = localStorage.getItem(KEY); return v ? { ...emptyAnswers(), ...JSON.parse(v) } : null; } catch { return null; }
  },
  save(a: Answers) {
    try { localStorage.setItem(KEY, JSON.stringify(a)); } catch { /* private mode */ }
  },
  clear() {
    try { localStorage.removeItem(KEY); } catch { /* private mode */ }
  },
};
