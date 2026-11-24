import { runPlan } from "./plan";
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
  if (!plan) {
    const r = await runPlan(env, profile, question, snapshot.affordances);
    plan = r.plan;
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
  const assessment = assess(candidates, profile, plan, weights);
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

  return { plan, briefing, usage, composeAttempts, counts };
}
