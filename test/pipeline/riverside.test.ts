import { describe, expect, it } from "vitest";
import { fixtureSnapshot, RIVERSIDE } from "../fixtures";
import { weigh } from "../../src/pipeline/weigh";
import { retrieveMechanisms, retrieveOrgTypes, retrieveTools } from "../../src/pipeline/retrieve";
import { assess } from "../../src/pipeline/assess";
import type { Plan } from "../../src/shared/schema";

// Fixed plan so the golden test exercises code steps only (the mockup's four needs).
const PLAN: Plan = {
  needs: [
    { affordanceId: "consent-governance", plain: "Members propose and decide on purchases" },
    { affordanceId: "transparent-resource-governance", plain: "Anyone can see what was spent" },
    { affordanceId: "dissent-pathways", plain: "Members can object, not just be outvoted" },
    { affordanceId: "non-monetary-exchange", plain: "Members pledge money or time" },
  ],
  otherMappings: [],
  wantsOrgModels: true,
  wantsMoney: true,
  source: "clef",
};

describe("Riverside golden (mockup frame 13)", () => {
  const snap = fixtureSnapshot();
  const weights = weigh(RIVERSIDE.profile, PLAN);
  const candidates = retrieveTools(snap, PLAN, weights);
  const a = assess(candidates, RIVERSIDE.profile, PLAN, weights, Date.parse("2026-11-24"));

  it("compares Bonfire, Group Income, Hypha and Moss, alphabetically", () => {
    expect(a.comparison).toEqual(expect.arrayContaining(["bonfire-networks", "group-income", "hypha", "moss"]));
    const names = a.comparison.map((id) => snap.byId.get(id)!.name);
    expect(names).toEqual([...names].sort((x, y) => x.localeCompare(y)));
  });

  it("sets SpiritDAO aside for crypto and shows it", () => {
    const s = a.setAside.find((x) => x.toolId === "spiritdao-community-app");
    expect(s?.reason).toMatch(/You ruled out crypto/);
  });

  it("classifies Valueflows as a building block, not an option", () => {
    expect(a.comparison).not.toContain("valueflows");
    expect(a.excluded.find((e) => e.toolId === "valueflows")?.why).toBe("buildingBlock");
  });

  it("puts nothing that breaks a limit in the comparison", () => {
    const limitCells = a.cells.filter((c) => c.column.startsWith("limit."));
    expect(limitCells.filter((c) => c.state === "conflict")).toEqual([]);
  });

  it("gives every decided cell a fieldRef and leaves missing fields unknown", () => {
    for (const c of a.cells) {
      if (c.state !== "unknown") expect(c.fieldRef).toMatch(/^[a-z0-9-]+\.[\w.]+@\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("asks Hypha about tokens", () => {
    const q = a.questions.find((x) => /tokens or a crypto wallet/.test(x.question));
    expect(q && (q.toolIds === "all" || q.toolIds.includes("hypha"))).toBe(true);
  });

  it("finds related org models and money approaches without crypto", () => {
    const orgs = retrieveOrgTypes(snap, RIVERSIDE.profile).map((o) => o.id);
    const mech = retrieveMechanisms(snap, RIVERSIDE.profile).map((m) => m.id);
    expect(orgs).not.toContain("dao");
    expect(orgs.length).toBeGreaterThan(0);
    expect(mech.every((m) => !["btc", "eth", "algo-stable", "asset-stable", "carbon-token"].includes(m))).toBe(true);
    console.log({ comparison: a.comparison, setAside: a.setAside, orgs, mech, questions: a.questions, more: a.moreCount, notReady: a.notReady });
  });
});
