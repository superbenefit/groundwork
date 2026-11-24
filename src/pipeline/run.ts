import { plainFallback, runPlan, wordNeeds } from "./plan";
import { weigh } from "./weigh";
import { retrieveMechanisms, retrieveOrgTypes, retrieveTools } from "./retrieve";
import { assess } from "./assess";
import { compose } from "./compose";
import type { ModelEnv, Usage } from "./ai";
import type { Snapshot } from "../openhaven/snapshot";
import type { Briefing, Plan, Profile } from "../shared/schema";

export const STEPS = [
  { key: "plan", label: "Understanding your question" },
  { key: "weigh", label: "Weighing your priorities" },
  { key: "retrieve", label: "Finding tools that match" },
  { key: "assess", label: "Removing what you ruled out" },
  { key: "compose", label: "Writing your briefing" },
] as const;
export type StepKey = (typeof STEPS)[number]["key"];

/** What a recovered run can skip: the two model steps. Code steps are cheap and re-run. */
export type RunStash = { plan?: Plan; briefing?: Briefing };

export type RunHooks = {
  step(key: StepKey, status: "active" | "done", detail?: string): void;
  stash(data: RunStash): void;
};

export type RunResult = {
  plan: Plan;
  briefing: Briefing;
  usage: Usage[];
  composeAttempts: { errors: string[] }[];
  counts: { tools: number; options: number; setAside: number };
  /** Top capability probabilities from the decision call (diagnostics). */
  topProbabilities: Record<string, number>;
};

export async function runPipeline(
  env: ModelEnv,
  snapshot: Snapshot,
  profile: Profile,
  question: string,
  hooks: RunHooks,
  resume: RunStash = {},
): Promise<RunResult> {
  const usage: Usage[] = [];
  const saved: RunStash = { ...resume };

  hooks.step("plan", "active");
  let plan = resume.plan;
  let topProbabilities: Record<string, number> = {};
  if (!plan) {
    const r = await runPlan(env, profile, question, snapshot.affordances);
    plan = r.plan;
    topProbabilities = Object.fromEntries(Object.entries(r.probabilities).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => [k, Math.round(v * 1000) / 1000]));
    usage.push(...r.usage);
    saved.plan = plan;
    hooks.stash(saved);
  }
  hooks.step("plan", "done", `${plan.needs.length} needs`);

  hooks.step("weigh", "active");
  const weights = weigh(profile, plan);
  hooks.step("weigh", "done");

  hooks.step("retrieve", "active");
  const candidates = retrieveTools(snapshot, plan, weights);
  const orgTypes = plan.wantsOrgModels || profile.legal !== "informal" ? retrieveOrgTypes(snapshot, profile) : [];
  const mechanisms = plan.wantsMoney ? retrieveMechanisms(snapshot, profile) : [];
  hooks.step("retrieve", "done", `${candidates.length} tools`);

  hooks.step("assess", "active");
  let assessment = assess(candidates, profile, plan, weights);
  // Too few options: widen with the next most likely needs and look again (once).
  if (assessment.comparison.length < 2 && !resume.plan) {
    const have = new Set(plan.needs.map((n) => n.affordanceId));
    const extra = Object.entries(topProbabilities).filter(([id, p]) => !have.has(id) && p >= 0.3).slice(0, Math.max(0, 5 - plan.needs.length)).slice(0, 2);
    if (extra.length) {
      const w = await wordNeeds(env, profile, question, extra.map(([id]) => id), snapshot.affordances);
      if (w.usage) usage.push(w.usage);
      plan = {
        ...plan,
        needs: [
          ...plan.needs,
          ...extra.map(([id, p]) => {
            const worded = w.wording?.needs.find((n) => n.affordanceId === id)?.plain;
            const a = snapshot.affordanceById.get(id);
            return { affordanceId: id, plain: (worded || (a ? plainFallback(a) : id)).slice(0, 80), why: "Added because few tools meet the main needs.", p };
          }),
        ],
      };
      const w2 = weigh(profile, plan);
      const c2 = retrieveTools(snapshot, plan, w2);
      assessment = assess(c2, profile, plan, w2);
      candidates.splice(0, candidates.length, ...c2);
      saved.plan = plan;
      hooks.stash(saved);
    }
  }
  const counts = { tools: candidates.length, options: assessment.comparison.length, setAside: assessment.excluded.filter((e) => e.why !== "notReady").length };
  hooks.step("assess", "done", `${counts.options} options, ${assessment.setAside.length} set aside`);

  hooks.step("compose", "active");
  let briefing = resume.briefing;
  let composeAttempts: { errors: string[] }[] = [];
  if (!briefing) {
    const r = await compose(env, { profile, question, plan, assessment, orgTypes, mechanisms, snapshot });
    briefing = r.briefing;
    composeAttempts = r.attempts;
    usage.push(...r.usage);
    saved.briefing = briefing;
    hooks.stash(saved);
  }
  hooks.step("compose", "done");

  return { plan, briefing, usage, composeAttempts, counts, topProbabilities };
}
