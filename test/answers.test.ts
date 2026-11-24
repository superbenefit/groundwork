import { describe, expect, it } from "vitest";
import { normalizeAnswers, toProfile } from "../web/lib/answers";
import { allDecisions, allReach, Profile } from "../src/shared/schema";

describe("multi-select answers", () => {
  it("keeps every chosen value: the first as the main answer, the rest as additional", () => {
    const p = toProfile(normalizeAnswers({ name: "G", reach: ["members", "local"], decision: ["vote", "roles", "other"], other: { decision: "elders advise" } }));
    expect(p.reach).toBe("members");
    expect(p.reachAlso).toEqual(["local"]);
    expect(allDecisions(p)).toEqual(["vote", "roles", "other"]);
    expect(p.other.decision).toBe("elders advise");
  });
  it("reads drafts and groups saved before the questions took several answers", () => {
    const a = normalizeAnswers({ reach: "local", decision: "consensus" } as never);
    expect(a.reach).toEqual(["local"]);
    expect(a.decision).toEqual(["consensus"]);
    const old = Profile.parse({ name: "Old", purpose: "", scale: "team", reach: "local", decision: "vote", leans: { speedSay: 3, stableAdapt: 3, autoJudge: 3 }, limits: [], setup: "none", legal: "informal" });
    expect(allReach(old)).toEqual(["local"]);
  });
});
