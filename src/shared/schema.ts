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

/** Output of the Plan step (PRD §9). Kept flat: small models handle flat schemas more reliably. */
export const Plan = z.object({
  needs: z
    .array(
      z.object({
        plain: z.string().describe("The need in plain words, under 12 words, no jargon"),
        affordanceId: z.string().describe("Exactly one id from the capability list"),
      }),
    )
    .min(2)
    .max(5),
  otherMappings: z
    .array(
      z.object({
        field: z.enum(["scale", "reach", "decision", "limits", "setup", "legal"]),
        mappedTo: z.string().optional().describe("The closest listed option, if one fits"),
        note: z.string().describe("What the free-text answer means for tool choice, in plain words"),
      }),
    )
    .default([]),
  wantsOrgModels: z.boolean(),
  wantsMoney: z.boolean(),
});
export type Plan = z.infer<typeof Plan>;
