import { describe, expect, it } from "vitest";
import { fixtureSnapshot, RIVERSIDE } from "../fixtures";
import { weigh } from "../../src/pipeline/weigh";
import { retrieveMechanisms, retrieveOrgTypes, retrieveTools } from "../../src/pipeline/retrieve";
import { assess } from "../../src/pipeline/assess";
import { assemble, factSheet, type ComposeInput } from "../../src/pipeline/compose";
import { fallbackProse } from "../../src/pipeline/fallback";
import { validateBriefing, type ValidationContext } from "../../src/pipeline/validate";
import { decisionQuestions, pickNeeds } from "../../src/pipeline/plan";
import type { Briefing, Plan } from "../../src/shared/schema";

const PLAN: Plan = {
  needs: [
    { affordanceId: "consent-governance", plain: "Members propose and decide on purchases" },
    { affordanceId: "transparent-resource-governance", plain: "Anyone can see what was spent" },
  ],
  otherMappings: [],
  wantsOrgModels: true,
  wantsMoney: true,
  source: "clef",
};

const snapshot = fixtureSnapshot();
const { profile, question } = RIVERSIDE;
const weights = weigh(profile, PLAN);
const assessment = assess(retrieveTools(snapshot, PLAN, weights), profile, PLAN, weights, Date.parse("2026-11-24"));
const input: ComposeInput = { profile, question, plan: PLAN, assessment, orgTypes: retrieveOrgTypes(snapshot, profile), mechanisms: retrieveMechanisms(snapshot, profile), snapshot };
const base = fallbackProse({ ...input, views: Object.values(assessment.views) });
const good = assemble(input, base, "fallback");
const ctx: ValidationContext = {
  cells: assessment.cells,
  comparison: assessment.comparison,
  setAside: assessment.setAside.map((s) => s.toolId),
  allToolNames: snapshot.tools.map((t) => t.name),
  allowedText: factSheet(input),
  briefingToolNames: [...assessment.comparison, ...assessment.setAside.map((s) => s.toolId)].map((id) => snapshot.byId.get(id)!.name),
};
const mutate = (f: (b: Briefing) => void) => {
  const b = structuredClone(good);
  f(b);
  return validateBriefing(b, ctx);
};
const block = <K extends Briefing["blocks"][number]["kind"]>(b: Briefing, kind: K) => b.blocks.find((x) => x.kind === kind) as Extract<Briefing["blocks"][number], { kind: K }>;

describe("validator", () => {
  it("accepts the template briefing", () => {
    expect(validateBriefing(good, ctx)).toEqual([]);
    expect(good.title).not.toMatch(/\?$/);
  });
  it("rejects \"best\" anywhere, even when denying it", () => {
    expect(mutate((b) => (block(b, "howToChoose").items[0]!.body = "No option is best for your group."))).toEqual(expect.arrayContaining([expect.stringMatching(/"best"/)]));
  });
  it("rejects first-person plural", () => {
    expect(mutate((b) => (b.overview[0] = "We compared four tools for you."))).toEqual(expect.arrayContaining([expect.stringMatching(/"we"/)]));
    expect(mutate((b) => (b.overview[0] = "Tell us what you learn."))).toEqual(expect.arrayContaining([expect.stringMatching(/"us"/)]));
  });
  it("allows the US abbreviation", () => {
    expect(mutate((b) => (b.overview[0] = "Group Income is run by a US non-profit."))).toEqual([]);
  });
  it("rejects titles that end with a question mark, refer back, or name a tool", () => {
    expect(mutate((b) => (b.title = "Which tools fit?"))).toEqual(expect.arrayContaining(["title ends with a question mark"]));
    expect(mutate((b) => (b.title = "Answers to your question"))).toEqual(expect.arrayContaining(["title refers back to the question"]));
    expect(mutate((b) => (b.title = "Moss and other voting tools"))).toEqual(expect.arrayContaining(["title contains a tool name"]));
  });
  it("rejects a cell that differs from Assess", () => {
    expect(mutate((b) => { const c = block(b, "comparison").cells[0]!; c.state = c.state === "yes" ? "conflict" : "yes"; })).toEqual(expect.arrayContaining([expect.stringMatching(/differs from Assess/)]));
  });
  it("rejects a tool that was not retrieved", () => {
    expect(mutate((b) => block(b, "setAside").items.push({ toolId: "nostr", reason: "x" }))).toEqual(expect.arrayContaining([expect.stringMatching(/nostr was not retrieved/)]));
  });
  it("rejects prose naming a tool outside the briefing", () => {
    expect(mutate((b) => (block(b, "howToChoose").items[0]!.body = "Nostr is another option."))).toEqual(expect.arrayContaining([expect.stringMatching(/names Nostr/)]));
  });
  it("rejects a long overview and out-of-order blocks", () => {
    expect(mutate((b) => (b.overview = [Array(130).fill("word").join(" ")]))).toEqual(expect.arrayContaining([expect.stringMatching(/overview is 130 words/)]));
    expect(mutate((b) => b.blocks.reverse())).toEqual(expect.arrayContaining([expect.stringMatching(/out of order/)]));
  });
});

describe("plan helpers", () => {
  it("asks at most 64 decision questions", () => {
    const q = decisionQuestions({ ...profile, other: { scale: "a", reach: "b", decision: "c", limits: "d", setup: "e", legal: "f" } }, snapshot.affordances);
    expect(Object.keys(q).length).toBeLessThanOrEqual(64);
  });
  it("keeps 2 to 5 needs", () => {
    expect(pickNeeds([{ id: "a", p: 0.9 }, { id: "b", p: 0.1 }, { id: "c", p: 0.2 }]).map((x) => x.id)).toEqual(["a", "c"]);
    expect(pickNeeds(Array.from({ length: 9 }, (_, i) => ({ id: `n${i}`, p: 0.9 - i / 100 }))).length).toBe(5);
  });
});
