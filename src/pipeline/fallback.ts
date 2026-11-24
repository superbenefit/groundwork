import type { Mechanism, OrgType } from "../openhaven/types";
import type { Plan, Profile, ToolView } from "../shared/schema";
import type { Assessment } from "./assess";
import { joinList } from "./assess";
import { leanLabel, SCALE_POLES } from "./vocab";

/**
 * Template prose for every model-written field (SPEC §9.3). Used whole when Compose fails twice,
 * and piece by piece when the model leaves a field out.
 */

export type Prose = {
  title: string;
  overview: string[];
  implications: Record<"speedSay" | "stableAdapt" | "autoJudge", string>;
  kinds: Record<string, string>;
  howToChoose: { title: string; body: string }[];
  safeguards: { leaning: string; risk: string; safeguard: string }[];
  legal: { paragraphs: string[]; notes: Record<string, string> };
  testReview: { steps: string; review: string[] };
};

const IMPLICATION = {
  speedSay: {
    low: "A few people can decide quickly. Tools with roles and delegated decisions fit better than tools built around group votes.",
    mid: "Some decisions sit with a few people and some go to everyone. Look for tools that support both.",
    high: "Decisions will be slower, and the tool has to reach members who rarely log in.",
  },
  stableAdapt: {
    low: "Rules should stay put once agreed. Tools with fixed, well-documented processes fit better.",
    mid: "Rules change now and then. Check how much effort a change takes in each tool.",
    high: "Look for tools where volunteers can change how decisions work without a developer.",
  },
  autoJudge: {
    low: "Software can carry out decisions once they pass, such as releasing payments. Check what happens when something goes wrong.",
    mid: "Some steps can be automatic, but people should be able to step in. Check which steps each tool automates.",
    high: "Tools that record decisions for people to act on fit better than tools that act automatically, such as votes that release payments.",
  },
} as const;
const band = (v: number) => (v <= 2 ? "low" : v >= 4 ? "high" : "mid");

const SAFEGUARD: Record<string, { leaning: string; risk: string; safeguard: string }> = {
  "speedSay.high": { leaning: "Because everyone has a say", risk: "decisions stall when too few members respond, or a handful of active members decide everything.", safeguard: "agree who can vote (for example, current members), set a minimum turnout, and let proposals lapse after a deadline." },
  "speedSay.low": { leaning: "Because a few people decide", risk: "the people affected stop trusting decisions they had no part in.", safeguard: "publish each decision with its reason, and give members a way to ask for a review." },
  "stableAdapt.high": { leaning: "Because rules can change", risk: "rules shift so often that members lose track, or a small group rewrites them.", safeguard: "write down how rules get changed, and require wider agreement for changes to that process itself." },
  "stableAdapt.low": { leaning: "Because rules stay put", risk: "rules stop fitting as the group grows, and people work around them.", safeguard: "set a date each year to review the rules, even if nothing changes." },
  "autoJudge.high": { leaning: "Because people use judgement", risk: "decisions become hard to trace or question later.", safeguard: "record who decided what, why, and what it cost, where every member can read it." },
  "autoJudge.low": { leaning: "Because software enforces the rules", risk: "a mistake in the rules runs automatically before anyone notices.", safeguard: "keep a way to pause or reverse an automatic action, and test rule changes on something small first." },
};

const LEGAL: Record<string, string[]> = {
  informal: [
    "An informal group can't hold money or sign agreements in its own name. In practice one member holds funds and signs on the group's behalf, and carries the risk.",
    "If shared money grows, a nonprofit or co-op gives the group its own account. A fiscal host, an existing charity that holds funds for projects, is a lighter option.",
  ],
  nonprofit: [
    "As a nonprofit, your group can hold money and sign agreements in its own name. Its board stays legally responsible for how funds are used, whatever a tool records.",
    "Check that your bylaws allow decisions to be made this way, and that the tool's records would satisfy your board and your regulator.",
  ],
  coop: [
    "As a co-op, your group's members own it, and its rules set how members vote. A tool has to fit those rules, not replace them.",
    "Check that your rules allow online votes, and how a vote recorded in a tool is formally ratified.",
  ],
  company: [
    "As a company, your group's directors are legally responsible for decisions and money, whatever a tool records.",
    "Check which decisions your articles reserve for directors or shareholders before moving them into a tool.",
  ],
  unsure: [
    "Your legal form decides who can hold shared money and sign agreements. Until that is clear, one person usually does both and carries the risk.",
    "Check whether your group is already registered, or hosted by another organization, before choosing how money moves.",
  ],
  other: [
    "Your legal form decides who can hold shared money and sign agreements, and who answers for decisions a tool records.",
    "Check that your governing documents allow decisions to be made this way.",
  ],
};

export function fallbackProse(input: {
  profile: Profile;
  plan: Plan;
  assessment: Assessment;
  views: ToolView[];
  orgTypes: OrgType[];
  mechanisms: Mechanism[];
}): Prose {
  const { profile, plan, assessment } = input;
  const n = assessment.comparison.length;
  const leans = profile.leans;
  const strong = (Object.keys(SCALE_POLES) as (keyof typeof SCALE_POLES)[]).filter((k) => leans[k] !== 3);
  const needs = plan.needs.map((x) => x.plain.replace(/[.\s]+$/, ""));
  const risks = input.views.filter((v) => assessment.comparison.includes(v.id));
  const moderate = risks.filter((v) => v.takeoverRiskPlain !== "Low risk").map((v) => v.name);
  const early = risks.filter((v) => v.maturityPlain === "Early release").map((v) => v.name);
  return {
    title: `Software options for ${profile.name}`.slice(0, 80),
    overview: [
      `${profile.name} needs: ${needs.join("; ")}. ${n ? `${n} ready-made ${n === 1 ? "option meets" : "options meet"} at least one of these without breaking your limits.` : "No ready-made option meets these without breaking your limits."}`,
      `This briefing compares them, lists what is still unknown, and covers safeguards, your legal setup and how to test a choice.`,
    ],
    implications: {
      speedSay: IMPLICATION.speedSay[band(leans.speedSay)],
      stableAdapt: IMPLICATION.stableAdapt[band(leans.stableAdapt)],
      autoJudge: IMPLICATION.autoJudge[band(leans.autoJudge)],
    },
    kinds: {},
    howToChoose: [
      { title: "What each option covers", body: n > 1 ? "No option is marked for every need. Fewer tools means less for volunteers to maintain; more tools can cover more. Compare the ticks across each row." : "Check the ticks for each need, and the questions below for what is still unknown." },
      { title: "Takeover risk", body: `How easily one company, funder or maintainer could change the tool's direction. Low means control is spread out. It says nothing about quality or ease of use.${moderate.length ? ` ${joinList(moderate)} ${moderate.length === 1 ? "is" : "are"} moderate or higher.` : ""}` },
      { title: "Maturity", body: `Early release tools are usable but may change.${early.length ? ` ${joinList(early)} ${early.length === 1 ? "is an early release" : "are early releases"}.` : ""}` },
    ],
    safeguards: strong.map((k) => SAFEGUARD[`${k}.${leans[k] >= 4 ? "high" : "low"}`]!),
    legal: {
      paragraphs: LEGAL[profile.legal] ?? LEGAL.other!,
      notes: Object.fromEntries([
        ...input.orgTypes.map((o) => [o.id, o.shortDescription]),
        ...input.mechanisms.map((m) => [m.id, firstSentence(m.panelDesc ?? m.desc ?? m.name)]),
      ]),
    },
    testReview: {
      steps: "Pick two options from the comparison. Ask each project the questions above. Then run one real decision in one tool, start to finish, before moving everything over.",
      review: [
        "How many members took part, and who didn't?",
        "How long did the decision take, from proposal to outcome?",
        "Were objections raised, and did the process handle them?",
        "What did the volunteers find hard to keep up?",
      ],
    },
  };
}

export { leanLabel };
const firstSentence = (s: string) => (s.match(/^.*?[.!?](\s|$)/)?.[0] ?? s).trim().slice(0, 200);
