import { allDecisions, allReach, type Plan, type Profile } from "../shared/schema";
import type { Snapshot } from "../openhaven/snapshot";
import type { Mechanism, OrgType, Tool } from "../openhaven/types";
import type { Weights } from "./weigh";

export type Candidate = { tool: Tool; covers: string[]; score: number };

/**
 * Every tool with any planned capability, across all domains (OpenHaven files some tools
 * outside the domain of their capabilities, so domain-first lookup misses them).
 * Score = sum of weights over covered needs. Used for the cap only; never shown.
 */
export function retrieveTools(snapshot: Snapshot, plan: Plan, weights: Weights): Candidate[] {
  const needIds = plan.needs.map((n) => n.affordanceId);
  const seen = new Map<string, Candidate>();
  for (const id of needIds) {
    for (const tool of snapshot.byAffordance.get(id) ?? []) {
      if (seen.has(tool.id)) continue;
      const covers = needIds.filter((n) => tool.affordanceIds.includes(n));
      const score = covers.reduce((s, n) => s + (weights.affordance[n] ?? 1), 0);
      seen.set(tool.id, { tool, covers, score });
    }
  }
  return [...seen.values()].sort((a, b) => b.score - a.score || b.tool.devStatusCode - a.tool.devStatusCode || a.tool.id.localeCompare(b.tool.id));
}

const DECISION: Record<string, string[]> = {
  single: ["hierarchical"],
  consensus: ["consensus-deliberative"],
  vote: ["representative", "liquid-democracy"],
  roles: ["consensus-deliberative", "hierarchical"],
  board: ["representative", "hierarchical"],
  unsettled: [],
  other: [],
};
const LEGAL: Record<string, string[]> = {
  informal: ["informal", "none"],
  nonprofit: ["incorporated-wrapper"],
  coop: ["incorporated-wrapper"],
  company: ["incorporated-wrapper"],
  unsure: [],
  other: [],
};
const CAPITAL: Record<string, string[]> = { nonprofit: ["dues-grants", "commons-pooled"], coop: ["commons-pooled", "employment-ownership"], company: ["equity-profit"], informal: ["commons-pooled", "dues-grants"] };
const PURPOSE: Record<string, string[]> = { nonprofit: ["civic-public-good", "commons-stewardship", "mission-driven"], coop: ["commons-stewardship", "mission-driven"], informal: ["commons-stewardship", "civic-public-good"], company: ["profit-maximizing", "mission-driven"] };
const SCALE: Record<string, string[]> = { members: ["variable"], local: ["variable"], regional: ["variable", "national"], national: ["national", "variable"], global: ["global", "variable"], online: ["global", "variable"], other: ["variable"] };

const isTokenOrg = (o: OrgType) => o.membershipModel === "token-nft" || o.capitalModel === "on-chain-treasury" || o.decisionMaking === "token-weighted";

/** Org models: overlap on decisions, legal personhood, capital, purpose and scale. Top 2. */
export function retrieveOrgTypes(snapshot: Snapshot, profile: Profile): OrgType[] {
  const noCrypto = profile.limits.includes("crypto");
  return snapshot.orgTypes
    .filter((o) => !(noCrypto && isTokenOrg(o)))
    .map((o) => ({
      o,
      s:
        (allDecisions(profile).some((d) => DECISION[d]?.includes(o.decisionMaking)) ? 2 : 0) +
        (LEGAL[profile.legal]?.includes(o.legalPersonhood) ? 2 : 0) +
        (CAPITAL[profile.legal]?.includes(o.capitalModel) ? 1 : 0) +
        (PURPOSE[profile.legal]?.includes(o.purposeOrientation) ? 1 : 0) +
        (allReach(profile).some((r) => SCALE[r]?.includes(o.scale)) ? 1 : 0),
    }))
    .filter((x) => x.s >= 3)
    .sort((a, b) => b.s - a.s || a.o.id.localeCompare(b.o.id))
    .slice(0, 2)
    .map((x) => x.o);
}

const MECH_SCALE: Record<string, string[]> = { members: ["local", "variable"], local: ["local", "variable"], regional: ["regional", "local", "variable"], national: ["national", "regional", "variable"], global: ["global", "variable"], online: ["global", "variable"], other: ["variable"] };
const CRYPTO_MECH = /crypto|token|coin|blockchain|on-chain|eth|btc|stablecoin/i;

/** Ways of handling money: scale fit, alternatives over incumbents, crypto excluded when ruled out. Top 2. */
export function retrieveMechanisms(snapshot: Snapshot, profile: Profile): Mechanism[] {
  const noCrypto = profile.limits.includes("crypto");
  return snapshot.mechanisms
    .filter((m) => !(noCrypto && (m.systemType === "crypto-native-incumbent" || CRYPTO_MECH.test(`${m.name} ${m.desc ?? ""}`))))
    .filter((m) => m.systemType !== "legacy-incumbent" && m.systemType !== "prototype-conceptual")
    .map((m) => ({ m, s: (allReach(profile).some((r) => MECH_SCALE[r]?.includes(m.scale)) ? 2 : 0) + (m.systemType === "established-alternative" ? 1 : 0) + (m.coordination === "deliberative" || m.coordination === "trust" ? 1 : 0) }))
    .filter((x) => x.s >= 2)
    .sort((a, b) => b.s - a.s || a.m.id.localeCompare(b.m.id))
    .slice(0, 2)
    .map((x) => x.m);
}
