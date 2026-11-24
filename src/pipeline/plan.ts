import { generateText, Output, type LanguageModel } from "ai";
import { Plan, type Profile } from "../shared/schema";
import type { Affordance } from "../openhaven/types";

export function planPrompt(profile: Profile, question: string, affordances: Affordance[]) {
  const caps = affordances.map((a) => `- ${a.id}: ${a.name}. ${a.description}`).join("\n");
  const other = Object.entries(profile.other ?? {})
    .filter(([, v]) => v)
    .map(([k, v]) => `- ${k} (free text): ${v}`)
    .join("\n");
  return [
    "Map a group's question to the software capabilities it needs.",
    "Pick 2 to 5 needs. Each need uses exactly one capability id from the list. Never invent ids.",
    "For every free-text answer, say which listed option it is closest to (if any) and what it means for tool choice.",
    "wantsOrgModels: true if the question or legal answer touches how the group is structured or incorporated.",
    "wantsMoney: true if the question touches money, budgets, dues, funding or payments.",
    "",
    "Capabilities:",
    caps,
    "",
    "Group:",
    JSON.stringify({ ...profile, other: undefined }),
    other ? `Free-text answers:\n${other}` : "",
    "",
    `Question: ${question}`,
  ].join("\n");
}

export type PlanResult = { plan: Plan; dropped: string[]; ms: number; usage?: unknown };

/** One structured, non-streaming call (Workers AI rejects JSON Schema when streaming). */
export async function runPlan(
  model: LanguageModel,
  profile: Profile,
  question: string,
  affordances: Affordance[],
): Promise<PlanResult> {
  const t = Date.now();
  const res = await generateText({
    model,
    output: Output.object({ schema: Plan }),
    prompt: planPrompt(profile, question, affordances),
    temperature: 0.2,
  });
  const ids = new Set(affordances.map((a) => a.id));
  const dropped = res.output.needs.filter((n) => !ids.has(n.affordanceId)).map((n) => n.affordanceId);
  const plan = { ...res.output, needs: res.output.needs.filter((n) => ids.has(n.affordanceId)) };
  return { plan, dropped, ms: Date.now() - t, usage: res.usage };
}
