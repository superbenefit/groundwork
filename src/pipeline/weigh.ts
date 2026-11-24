import type { Plan, Profile } from "../shared/schema";

export type Weights = {
  /** affordanceId → weight (1 = neutral). Affects which tools make the cap; output order stays alphabetical. */
  affordance: Record<string, number>;
  flags: {
    /** Group leans towards people using judgement: tools that act automatically are a risk. */
    judgementOverAutomation: boolean;
    /** Group leans towards software enforcing rules: tools that act automatically are a fit. */
    automationWelcome: boolean;
    /** Group wants rules that change: ask whether each tool lets the group edit its own process. */
    askAboutChangingRules: boolean;
  };
};

const SAY = ["consent-governance", "slow-deliberation", "dissent-pathways"];
const QUICK = ["composable-groups", "nested-coordination"];

export function weigh(profile: Profile, plan: Plan): Weights {
  const w: Record<string, number> = Object.fromEntries(plan.needs.map((n) => [n.affordanceId, 1]));
  const boost = (ids: string[], by: number) => ids.forEach((id) => (w[id] = (w[id] ?? 0) + by));
  const { speedSay, stableAdapt, autoJudge } = profile.leans;
  if (speedSay >= 4) boost(SAY, 0.5);
  if (speedSay <= 2) boost(QUICK, 0.5);
  return {
    affordance: w,
    flags: {
      judgementOverAutomation: autoJudge >= 4,
      automationWelcome: autoJudge <= 2,
      askAboutChangingRules: stableAdapt >= 4,
    },
  };
}
