import { z } from "zod";
import { writeJson, type ModelEnv, type Usage } from "./ai";
import { fallbackProse, type Prose } from "./fallback";
import { STYLE_RULES } from "./style";
import { validateBriefing, type ValidationContext } from "./validate";
import { leanLabel, LIMIT_LABEL, profileText } from "./vocab";
import type { Assessment } from "./assess";
import type { Snapshot } from "../openhaven/snapshot";
import type { Mechanism, OrgType } from "../openhaven/types";
import type { Block, Briefing, Plan, Profile } from "../shared/schema";

const ComposeOut = z.object({
  title: z.string(),
  overview: z.array(z.string()).min(1).max(2),
  leanings: z.array(z.object({ scale: z.enum(["speedSay", "stableAdapt", "autoJudge"]), implication: z.string() })),
  kinds: z.array(z.object({ toolId: z.string(), kind: z.string() })),
  howToChoose: z.array(z.object({ title: z.string(), body: z.string() })).min(1).max(4),
  safeguards: z.array(z.object({ leaning: z.string(), risk: z.string(), safeguard: z.string() })),
  legal: z.object({ paragraphs: z.array(z.string()).min(1).max(2), related: z.array(z.object({ id: z.string(), note: z.string() })) }),
  testReview: z.object({ steps: z.string(), review: z.array(z.string()).min(2).max(5) }),
});
type ComposeOut = z.infer<typeof ComposeOut>;

const str = { type: "string" };
const arr = (items: object) => ({ type: "array", items });
const obj = (properties: Record<string, object>) => ({ type: "object", properties, required: Object.keys(properties) });
const COMPOSE_SCHEMA = obj({
  title: str,
  overview: arr(str),
  leanings: arr(obj({ scale: { type: "string", enum: ["speedSay", "stableAdapt", "autoJudge"] }, implication: str })),
  kinds: arr(obj({ toolId: str, kind: str })),
  howToChoose: arr(obj({ title: str, body: str })),
  safeguards: arr(obj({ leaning: str, risk: str, safeguard: str })),
  legal: obj({ paragraphs: arr(str), related: arr(obj({ id: str, note: str })) }),
  testReview: obj({ steps: str, review: arr(str) }),
});

export type ComposeInput = {
  profile: Profile;
  question: string;
  plan: Plan;
  assessment: Assessment;
  orgTypes: OrgType[];
  mechanisms: Mechanism[];
  snapshot: Snapshot;
};

/** Record fields that answer common practical questions (install, phone, cost, offline, export). */
const DETAIL_FIELDS: [string, string][] = [
  ["webSupport", "Web"],
  ["mobileSupport", "Phone"],
  ["nativeApps", "Apps"],
  ["deploymentOptions", "Hosting"],
  ["terms", "Terms"],
  ["offlineCapabilities", "Offline"],
  ["dataPortability", "Data portability"],
  ["governanceDecisionMaking", "Decision-making"],
];

/** The facts the model writes from. Everything it may say about a tool is in here. */
export function factSheet(input: ComposeInput): string {
  const { assessment: a, snapshot, plan, profile } = input;
  const col = new Map(a.columns.map((c) => [c.id, c.label]));
  const mark = { yes: "yes", conflict: "no", unknown: "unknown" } as const;
  const tools = a.comparison.map((id) => {
    const t = snapshot.byId.get(id)!;
    const v = a.views[id]!;
    const cells = a.cells.filter((c) => c.toolId === id).map((c) => `${col.get(c.column)}: ${mark[c.state]}`).join("; ");
    return [
      `- ${t.name} (id ${id}). ${clean(t.description).slice(0, 360)}`,
      `  Maturity: ${v.maturityPlain}. Takeover risk: ${v.takeoverRiskPlain} — ${clean(t.captureRiskReasoning ?? "").slice(0, 220)}`,
      `  Reviewed ${v.reviewed}${v.stale ? " (over six months ago)" : ""}. Checks: ${cells}.`,
      ...DETAIL_FIELDS.filter(([k]) => t.entityAttributes?.[k]).map(([k, label]) => `  ${label}: ${clean(String(t.entityAttributes[k])).slice(0, 180)}`),
    ].join("\n");
  });
  const leans = (["speedSay", "stableAdapt", "autoJudge"] as const).map((k) => `${k} = ${profile.leans[k]} (${leanLabel(k, profile.leans[k])})`).join("; ");
  return [
    "GROUP",
    profileText(profile, input.question),
    `Leaning positions: ${leans}.`,
    "",
    "NEEDS (from the question)",
    ...plan.needs.map((n) => `- ${n.plain} — met by ${a.needCounts[n.affordanceId] ?? 0} of the options`),
    ...plan.otherMappings.map((m) => `- Free-text answer (${m.field}): ${m.note}`),
    "",
    `OPTIONS IN THE COMPARISON (${a.comparison.length}, alphabetical)`,
    ...(tools.length ? tools : ["- none"]),
    "",
    "SET ASIDE",
    ...(a.setAside.length ? a.setAside.map((s) => `- ${snapshot.byId.get(s.toolId)?.name}: ${s.reason}`) : ["- none"]),
    "",
    "OPEN QUESTIONS (already listed in the briefing)",
    ...a.questions.map((q) => `- ${q.question}`),
    "",
    "RELATED WAYS TO ORGANIZE AND HANDLE MONEY",
    ...input.orgTypes.map((o) => `- ${o.id}: ${o.name}. ${o.shortDescription}`),
    ...input.mechanisms.map((m) => `- ${m.id}: ${m.name}. ${clean(m.panelDesc ?? m.desc ?? "").slice(0, 200)}`),
    "",
    `Limit columns: ${profile.limits.map((l) => LIMIT_LABEL[l]).join(", ") || "none"}.`,
  ].join("\n");
}

const SYSTEM = [
  "Write the prose for a standalone briefing that helps a group choose software. Use only the facts given.",
  "title: a plain document title naming the topic as a noun phrase, under 70 characters, for example \"Tools for member voting and open spending\". It never answers, judges or refers back to the question, never ends with a question mark, and never names a tool.",
  "overview: 1 or 2 short paragraphs, at most 100 words in total: what the group wants, where it leans, how many options meet the needs, and what is still unknown.",
  "leanings: one implication per scale, one sentence, saying what that leaning means for choosing a tool.",
  "kinds: for each option in the comparison, what kind of tool it is in 2 to 4 plain words (for example \"Group workspace app\").",
  "howToChoose: 2 to 4 trade-offs that separate the options for this group. Each body is 2 to 4 sentences and may name options from the comparison.",
  "safeguards: one per leaning that is not Balanced: `leaning` starts with \"Because\", `risk` is the typical failure, `safeguard` a common fix that works whichever tool the group picks.",
  "legal: 1 or 2 paragraphs on what the group's legal form means for holding shared money and making binding decisions, and what to check. `related`: one short note for each id listed under related ways to organize and handle money.",
  "testReview: `steps` is how to trial one real decision before committing; `review` is 3 or 4 questions to look at afterwards (turnout, time to decide, objections, workload). Tool-neutral.",
  STYLE_RULES,
].join("\n");

export function assemble(input: ComposeInput, prose: Prose, composedBy: Briefing["composedBy"]): Briefing {
  const { assessment: a, plan, profile, snapshot } = input;
  const blocks: Block[] = [
    { kind: "leanings", items: (["speedSay", "stableAdapt", "autoJudge"] as const).map((scale) => ({ scale, value: profile.leans[scale], implication: prose.implications[scale] })) },
    { kind: "needs", items: plan.needs.map((n) => ({ plain: n.plain, affordanceId: n.affordanceId, count: a.needCounts[n.affordanceId] ?? 0 })) },
  ];
  if (a.comparison.length) blocks.push({ kind: "comparison", toolIds: a.comparison, columns: a.columns, cells: a.cells });
  if (prose.howToChoose.length) blocks.push({ kind: "howToChoose", items: prose.howToChoose });
  if (prose.safeguards.length) blocks.push({ kind: "safeguards", items: prose.safeguards });
  if (a.questions.length) blocks.push({ kind: "questions", items: a.questions });
  if (a.setAside.length) blocks.push({ kind: "setAside", items: a.setAside });
  blocks.push({
    kind: "legal",
    paragraphs: prose.legal.paragraphs,
    related: [
      ...input.orgTypes.map((o) => ({ kind: "orgModel" as const, id: o.id, name: o.name, note: prose.legal.notes[o.id] ?? o.shortDescription })),
      ...input.mechanisms.map((m) => ({ kind: "mechanism" as const, id: m.id, name: m.name, note: prose.legal.notes[m.id] ?? m.name })),
    ],
  });
  blocks.push({ kind: "testReview", steps: prose.testReview.steps, review: prose.testReview.review });
  const ids = [...a.comparison, ...a.setAside.map((s) => s.toolId)];
  return {
    title: prose.title,
    overview: prose.overview,
    blocks,
    tools: ids.map((id) => a.views[id]!).filter(Boolean),
    kinds: Object.fromEntries(Object.entries(prose.kinds).filter(([id]) => a.comparison.includes(id))),
    notReady: a.notReady,
    sources: ids.map((id) => ({ id, url: a.views[id]?.url ?? "", checked: snapshot.byId.get(id)?.lastInvestigated ?? "" })),
    snapshot: snapshot.fetchedAt,
    composedBy,
  };
}

/** Model output merged over the templates, so a missing piece never blanks a section. */
function toProse(out: ComposeOut, base: Prose): Prose {
  const impl = { ...base.implications };
  for (const l of out.leanings) if (l.implication.trim()) impl[l.scale] = l.implication.trim();
  const notes = { ...base.legal.notes };
  for (const r of out.legal.related) if (r.id in notes && r.note.trim()) notes[r.id] = r.note.trim();
  return {
    title: out.title.trim(),
    overview: out.overview.map((p) => p.trim()).filter(Boolean),
    implications: impl,
    kinds: Object.fromEntries(out.kinds.filter((k) => k.kind.trim() && k.kind.split(/\s+/).length <= 6).map((k) => [k.toolId, k.kind.trim()])),
    howToChoose: out.howToChoose.length ? out.howToChoose : base.howToChoose,
    safeguards: base.safeguards.length ? (out.safeguards.length ? out.safeguards : base.safeguards) : [],
    legal: { paragraphs: out.legal.paragraphs.length ? out.legal.paragraphs : base.legal.paragraphs, notes },
    testReview: out.testReview.review.length ? out.testReview : base.testReview,
  };
}

export type ComposeResult = { briefing: Briefing; attempts: { errors: string[] }[]; usage: Usage[] };

export async function compose(env: ModelEnv, input: ComposeInput): Promise<ComposeResult> {
  const views = Object.values(input.assessment.views);
  const base = fallbackProse({ ...input, views });
  const facts = factSheet(input);
  const briefingNames = [...input.assessment.comparison, ...input.assessment.setAside.map((s) => s.toolId)].map((id) => input.snapshot.byId.get(id)!.name);
  const ctx: ValidationContext = {
    cells: input.assessment.cells,
    comparison: input.assessment.comparison,
    setAside: input.assessment.setAside.map((s) => s.toolId),
    allToolNames: input.snapshot.tools.map((t) => t.name),
    allowedText: facts,
    briefingToolNames: briefingNames,
  };
  const attempts: { errors: string[] }[] = [];
  const usage: Usage[] = [];
  let feedback = "";
  for (let i = 0; i < 2; i++) {
    try {
      const r = await writeJson(env, { system: SYSTEM, user: facts + feedback, schema: ComposeOut, jsonSchema: COMPOSE_SCHEMA });
      usage.push(r.usage);
      const briefing = assemble(input, toProse(r.value, base), "model");
      let errors = validateBriefing(briefing, ctx);
      // An overview that is only too long is repaired in code rather than discarded.
      if (errors.length && errors.every((e) => /^overview is \d+ words/.test(e))) {
        briefing.overview = trimToWords(briefing.overview, 120);
        errors = validateBriefing(briefing, ctx);
      }
      attempts.push({ errors });
      if (!errors.length) return { briefing, attempts, usage };
      feedback = `\n\nYOUR PREVIOUS ANSWER WAS REJECTED. Fix these problems:\n${errors.map((e) => `- ${e}`).join("\n")}`;
    } catch (e) {
      attempts.push({ errors: [`model call failed: ${String((e as Error)?.message ?? e).slice(0, 200)}`] });
    }
  }
  const briefing = assemble(input, base, "fallback");
  return { briefing, attempts, usage };
}

/** Drops whole sentences from the end until the paragraphs fit. */
export function trimToWords(paragraphs: string[], max: number): string[] {
  const count = (ps: string[]) => ps.join(" ").split(/\s+/).filter(Boolean).length;
  const ps = paragraphs.map((p) => p.split(/(?<=[.!?])\s+/));
  while (count(ps.map((x) => x.join(" "))) > max) {
    const last = ps[ps.length - 1]!;
    if (last.length > 1) last.pop();
    else if (ps.length > 1) ps.pop();
    else break;
  }
  return ps.map((x) => x.join(" ")).filter(Boolean);
}

const clean = (s: string) => s.replace(/\s*\[[a-z]\](\[[a-z]\])*/g, "").replace(/\s+/g, " ").trim();
