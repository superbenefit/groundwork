import { readFileSync } from "node:fs";
import { buildSnapshot } from "../src/openhaven/snapshot";
import type { SnapshotFiles } from "../src/openhaven/types";
import { Profile } from "../src/shared/schema";

const read = (n: string) => JSON.parse(readFileSync(new URL(`../fixtures/openhaven/${n}.json`, import.meta.url), "utf8"));

export function fixtureSnapshot() {
  const files = Object.fromEntries(
    ["protocols", "affordances", "domains", "entity-types", "organization-types", "monetary-architecture"].map((n) => [n, read(n)]),
  ) as unknown as SnapshotFiles;
  return buildSnapshot(files, read("meta").fetchedAt);
}

/** The mockup's Riverside Tool Library (Main.dc.html defaults). */
export const RIVERSIDE = {
  profile: Profile.parse({
    name: "Riverside Tool Library",
    purpose: "We lend tools to neighbours so people don't each buy their own, and run a monthly repair night.",
    scale: "team",
    reach: "local",
    decision: "consensus",
    leans: { speedSay: 4, stableAdapt: 4, autoJudge: 4 },
    limits: ["crypto", "cost", "export"],
    setup: "none",
    legal: "nonprofit",
  }),
  question: "How can members vote on what we buy and see where the money goes, without needing a crypto wallet?",
};
