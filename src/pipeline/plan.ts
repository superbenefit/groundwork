import { z } from "zod";
import { decide, writeJson, type DecisionQuestion, type ModelEnv, type Usage } from "./ai";
import { OPTIONS, profileText } from "./vocab";
import { STYLE_RULES } from "./style";
import { OTHER_FIELDS, type OtherField, type Plan, type Profile } from "../shared/schema";
import type { Affordance } from "../openhaven/types";

const MAX_NEEDS = 5;
const MIN_NEEDS = 2;
const THRESHOLD = 0.5;

export function otherAnswers(profile: Profile): { field: OtherField; text: string }[] {
  const o = (profile.other ?? {}) as Partial<Record<OtherField, string>>;
  return OTHER_FIELDS.filter((f) => o[f]?.trim()).map((f) => ({ field: f, text: o[f]!.trim() }));
}

/** Questions for the decision model: one per capability, two flags, one choice per free-text answer. */
export function needCandidates(_profile: Profile, affordances: Affordance[]): Affordance[] {
  // Every capability stays a candidate: a festival with no internet needs offline tools as a need,
  // not only as a limit. Limits stay out of the decision state instead (runPlan).
  return affordances;
}

export function decisionQuestions(profile: Profile, affordances: Affordance[]): Record<string, DecisionQuestion> {
  const q: Record<string, DecisionQuestion> = {};
  for (const a of needCandidates(profile, affordances)) {
    // Name + description alone under-scores some needs (voting scored 0.30 for Riverside); the first
    // sentence of whatItEnables lifts it to 0.51 for about 4k more input tokens.
    const enables = (a.whatItEnables ?? "").split(/(?<=\.)\s/)[0] ?? "";
    q[`aff.${a.id}`] = { type: "noul", instructions: `Does this group need this capability to act on its question? ${a.name}: ${a.description}. ${enables}`.trim() };
  }
  q["flag.orgModels"] = { type: "noul", instructions: "Does the question or the group's legal answer touch how the group is structured, governed as an organization, or incorporated?" };
  q["flag.money"] = { type: "noul", instructions: "Does the question touch money: budgets, dues, funding, spending, pooling or payments?" };
  for (const { field, text } of otherAnswers(profile)) {
    q[`other.${field}`] = {
      type: "choice",
      instructions: `The group answered "${text}" instead of choosing an option. Which option is closest in meaning?`,
      criteria: { ...OPTIONS[field], none: "None of these is close" },
    };
  }
  return q;
}

export function pickNeeds(scored: { id: string; p: number }[]): { id: string; p: number }[] {
  const sorted = [...scored].sort((a, b) => b.p - a.p);
  const passing = sorted.filter((s) => s.p >= THRESHOLD).slice(0, MAX_NEEDS);
  return passing.length >= MIN_NEEDS ? passing : sorted.slice(0, MIN_NEEDS);
}

/** Last resort: keyword overlap between the question and capability descriptions. */
export function keywordNeeds(question: string, affordances: Affordance[]): { id: string; p: number }[] {
  const words = new Set(question.toLowerCase().match(/[a-z]{4,}/g) ?? []);
  return affordances
    .map((a) => ({ id: a.id, p: (`${a.name} ${a.description}`.toLowerCase().match(/[a-z]{4,}/g) ?? []).filter((w) => words.has(w)).length / 10 }))
    .sort((a, b) => b.p - a.p)
    .slice(0, MIN_NEEDS);
}

const Wording = z.object({
  needs: z.array(z.object({ affordanceId: z.string(), plain: z.string(), why: z.string() })),
  notes: z.array(z.object({ field: z.string(), note: z.string() })),
});
const WORDING_SCHEMA = {
  type: "object",
  properties: {
    needs: {
      type: "array",
      items: {
        type: "object",
        properties: { affordanceId: { type: "string" }, plain: { type: "string" }, why: { type: "string" } },
        required: ["affordanceId", "plain", "why"],
      },
    },
    notes: { type: "array", items: { type: "object", properties: { field: { type: "string" }, note: { type: "string" } }, required: ["field", "note"] } },
  },
  required: ["needs", "notes"],
};

export type PlanResult = { plan: Plan; usage: Usage[]; probabilities: Record<string, number> };

export async function runPlan(env: ModelEnv, profile: Profile, question: string, affordances: Affordance[]): Promise<PlanResult> {
  // Limits are checked separately (Assess), so they stay out of the decision state.
  const state = profileText(profile, question, { limits: false });
  const usage: Usage[] = [];
  const byId = new Map(affordances.map((a) => [a.id, a]));

  // 1. Decisions.
  let picked: { id: string; p: number }[];
  let source: Plan["source"] = "clef";
  let flags = { orgModels: profile.legal !== "informal", money: /money|budget|fund|spend|pay|dues|grant/i.test(question) };
  const mapped: Partial<Record<OtherField, string | undefined>> = {};
  const probabilities: Record<string, number> = {};
  try {
    const { answers, usage: u } = await decide(env, state, decisionQuestions(profile, affordances));
    usage.push(u);
    const scored = Object.entries(answers)
      .filter(([k]) => k.startsWith("aff."))
      .map(([k, a]) => ({ id: k.slice(4), p: a.type === "noul" ? a.noul : 0 }))
      .filter((s) => byId.has(s.id));
    for (const s of scored) probabilities[s.id] = s.p;
    picked = pickNeeds(scored);
    const fo = answers["flag.orgModels"], fm = answers["flag.money"];
    if (fo?.type === "noul") flags.orgModels = fo.noul >= 0.5 || profile.legal !== "informal";
    if (fm?.type === "noul") flags.money = fm.noul >= 0.5;
    for (const { field } of otherAnswers(profile)) {
      const a = answers[`other.${field}`];
      if (a?.type === "choice" && a.choice !== "none" && OPTIONS[field][a.choice]) mapped[field] = a.choice;
    }
  } catch {
    source = "keywords";
    picked = keywordNeeds(question, needCandidates(profile, affordances));
  }

  // 2. Wording.
  const others = otherAnswers(profile);
  let wording: z.infer<typeof Wording> | undefined;
  try {
    const r = await writeJson(env, {
      system: [
        "Write short plain wording for a group's needs and free-text answers.",
        "For each capability id: `plain` is the need as this group would say it, at most 10 words, specific to the question (for example \"Members propose and decide on purchases\"). `why` is one sentence on why the question needs it.",
        "For each free-text answer: `note` is at most 25 words on what the answer means for choosing software. Address the group as \"your group\".",
        STYLE_RULES,
      ].join("\n"),
      user: [
        profileText(profile, question),
        "",
        "Capabilities to word:",
        ...picked.map((n) => `- ${n.id}: ${byId.get(n.id)?.name}. ${byId.get(n.id)?.description}`),
        others.length ? "\nFree-text answers:\n" + others.map((o) => `- ${o.field}: ${o.text}`).join("\n") : "\nNo free-text answers; return an empty notes list.",
      ].join("\n"),
      schema: Wording,
      jsonSchema: WORDING_SCHEMA,
    });
    wording = r.value;
    usage.push(r.usage);
  } catch {
    // fall through to templates
  }

  const plan: Plan = {
    needs: picked.map((n) => {
      const w = wording?.needs.find((x) => x.affordanceId === n.id);
      const a = byId.get(n.id)!;
      return {
        affordanceId: n.id,
        plain: clip(w?.plain || a.name, 80),
        why: w?.why ? clip(w.why, 200) : undefined,
        p: Math.round(n.p * 1000) / 1000,
      };
    }),
    otherMappings: others.map((o) => ({
      field: o.field,
      mappedTo: mapped[o.field],
      note: clip(wording?.notes.find((x) => x.field === o.field)?.note || `Your group answered "${o.text}". The briefing treats it as context.`, 200),
    })),
    wantsOrgModels: flags.orgModels,
    wantsMoney: flags.money,
    source,
  };
  return { plan, usage, probabilities };
}

const clip = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1).trimEnd() + "…");
