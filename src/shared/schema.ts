import { z } from "zod";

const Other = z.string().max(280);

export const Profile = z.object({
  name: z.string().min(1).max(80),
  purpose: z.string().max(500),
  scale: z.enum(["solo", "team", "teams", "community", "network", "other"]),
  reach: z.enum(["members", "local", "regional", "national", "global", "online", "other"]),
  decision: z.enum(["single", "consensus", "vote", "roles", "board", "unsettled", "other"]),
  leans: z.object({
    speedSay: z.number().int().min(1).max(5),
    stableAdapt: z.number().int().min(1).max(5),
    autoJudge: z.number().int().min(1).max(5),
  }),
  leanNote: z.string().max(280).optional(),
  limits: z.array(z.enum(["crypto", "cost", "server", "mobile", "offline", "export"])),
  setup: z.enum(["none", "guided", "developer", "other"]),
  legal: z.enum(["informal", "nonprofit", "coop", "company", "unsure", "other"]),
  other: z
    .object({ scale: Other, reach: Other, decision: Other, limits: Other, setup: Other, legal: Other })
    .partial()
    .default({}),
});
export type Profile = z.infer<typeof Profile>;

export const Question = z.string().min(1).max(400);

export const RunPhase = z.enum(["queued", "plan", "weigh", "retrieve", "assess", "compose", "done", "failed"]);
export type RunPhase = z.infer<typeof RunPhase>;

export const LIMITS = ["crypto", "cost", "server", "mobile", "offline", "export"] as const;
export type Limit = (typeof LIMITS)[number];
export const OTHER_FIELDS = ["scale", "reach", "decision", "limits", "setup", "legal"] as const;
export type OtherField = (typeof OTHER_FIELDS)[number];

/** Output of the Plan step (SPEC §9.2). */
export const Plan = z.object({
  needs: z
    .array(
      z.object({
        affordanceId: z.string(),
        plain: z.string().max(80),
        why: z.string().max(200).optional(),
        p: z.number().min(0).max(1).optional(),
      }),
    )
    .min(1)
    .max(5),
  otherMappings: z.array(
    z.object({ field: z.enum(OTHER_FIELDS), mappedTo: z.string().optional(), note: z.string().max(200) }),
  ),
  wantsOrgModels: z.boolean(),
  wantsMoney: z.boolean(),
  source: z.enum(["clef", "fallback", "keywords"]),
});
export type Plan = z.infer<typeof Plan>;

export const CellState = z.enum(["yes", "conflict", "unknown"]);
export type CellState = z.infer<typeof CellState>;
export const Cell = z.object({ toolId: z.string(), column: z.string(), state: CellState, fieldRef: z.string().optional() });
export type Cell = z.infer<typeof Cell>;

/** Per-tool render data, computed in code (never by the model). */
export const ToolView = z.object({
  id: z.string(),
  name: z.string(),
  kindPlain: z.string(),
  maturityPlain: z.string(),
  takeoverRiskPlain: z.string(),
  reviewed: z.string(),
  stale: z.boolean(),
  url: z.string(),
  actsAutomatically: z.boolean(),
});
export type ToolView = z.infer<typeof ToolView>;

const Scale = z.enum(["speedSay", "stableAdapt", "autoJudge"]);
export const Block = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("leanings"), items: z.array(z.object({ scale: Scale, value: z.number().int().min(1).max(5), implication: z.string() })) }),
  z.object({ kind: z.literal("needs"), items: z.array(z.object({ plain: z.string(), affordanceId: z.string(), count: z.number().int() })) }),
  z.object({
    kind: z.literal("comparison"),
    toolIds: z.array(z.string()),
    columns: z.array(z.object({ id: z.string(), label: z.string(), group: z.enum(["need", "limit"]) })),
    cells: z.array(Cell),
  }),
  z.object({ kind: z.literal("howToChoose"), items: z.array(z.object({ title: z.string(), body: z.string() })) }),
  z.object({ kind: z.literal("safeguards"), items: z.array(z.object({ leaning: z.string(), risk: z.string(), safeguard: z.string() })) }),
  z.object({ kind: z.literal("questions"), items: z.array(z.object({ toolIds: z.union([z.array(z.string()), z.literal("all")]), question: z.string() })) }),
  z.object({ kind: z.literal("setAside"), items: z.array(z.object({ toolId: z.string(), reason: z.string() })) }),
  z.object({
    kind: z.literal("legal"),
    paragraphs: z.array(z.string()),
    related: z.array(z.object({ kind: z.enum(["orgModel", "mechanism"]), id: z.string(), name: z.string(), note: z.string() })),
  }),
  z.object({ kind: z.literal("testReview"), steps: z.string(), review: z.array(z.string()) }),
]);
export type Block = z.infer<typeof Block>;
export const BLOCK_ORDER = ["leanings", "needs", "comparison", "howToChoose", "safeguards", "questions", "setAside", "legal", "testReview"] as const;

export const Briefing = z.object({
  title: z.string(),
  overview: z.array(z.string()).min(1).max(2),
  blocks: z.array(Block),
  tools: z.array(ToolView),
  /** Short plain description of each tool's kind, written by the model; falls back to ToolView.kindPlain. */
  kinds: z.record(z.string(), z.string()).default({}),
  notReady: z.array(z.object({ id: z.string(), name: z.string() })).default([]),
  sources: z.array(z.object({ id: z.string(), url: z.string(), checked: z.string() })),
  snapshot: z.string(),
  composedBy: z.enum(["model", "fallback"]),
});
export type Briefing = z.infer<typeof Briefing>;
