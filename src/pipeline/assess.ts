import type { Cell, CellState, Limit, Plan, Profile, ToolView } from "../shared/schema";
import type { Tool } from "../openhaven/types";
import type { Candidate } from "./retrieve";
import type { Weights } from "./weigh";
import { APP_TYPES, isReady, kindPlain, LIMIT_LABEL, maturityPlain, takeoverRiskPlain } from "./vocab";

/**
 * Assess (SPEC §9.2): candidates × profile → cells, set-aside reasons, open questions.
 * Pure code over OpenHaven's fields. A missing or ambiguous field is always "unknown", never "conflict".
 */

export const COMPARISON_CAP = 6;
export const SET_ASIDE_CAP = 4;
const STALE_DAYS = 183;

type Check = { state: CellState; field?: string; detail?: "freemium" };

const attr = (t: Tool, k: string) => (t.entityAttributes?.[k] ?? "").trim();
const starts = (v: string, re: RegExp) => re.test(v.replace(/^[\s"'(]+/, ""));
const textOf = (t: Tool, keys: string[]) => keys.map((k) => (k in t ? String((t as Record<string, unknown>)[k] ?? "") : attr(t, k))).join(" \n ");

const CRYPTO_GATED = /token[- ]gated|must hold (a |an )?(token|nft)|hold(ing)? (a |an )?(membership )?token to (join|participate)|gas fees?|requires? (a )?(crypto(currency)? )?wallet/i;
const CRYPTO_MENTION = /\b(tokens?|blockchain|on-chain|wallets?|crypto|nft|smart contracts?|staking)\b/i;
const NO_TOKEN = /\b(no token|has no token|itself has no token|without (a )?token|no crypto)\b/i;
const MONEY_TYPES = new Set(["decentralized-monetary-protocol", "smart-contract-standard"]);

export const CHECKS: Record<Limit, (t: Tool) => Check> = {
  crypto(t) {
    if (MONEY_TYPES.has(t.entityType)) return { state: "conflict", field: "entityType" };
    for (const f of ["smartContract", "assetValueEmbedding"]) if (starts(attr(t, f), /^yes\b/i)) return { state: "conflict", field: `entityAttributes.${f}` };
    for (const f of ["description", "terms", "userInterfaceType", "deploymentOptions"]) {
      if (CRYPTO_GATED.test(textOf(t, [f]))) return { state: "conflict", field: f === "description" ? "description" : `entityAttributes.${f}` };
    }
    const all = textOf(t, ["description", "terms", "stack", "database", "dataFormats", "basedOn", "mobileSupport"]);
    if (CRYPTO_MENTION.test(all)) return { state: "unknown" };
    if (NO_TOKEN.test(t.captureRiskReasoning ?? "")) return { state: "yes", field: "captureRiskReasoning" };
    return { state: "unknown" };
  },
  cost(t) {
    const terms = `${attr(t, "terms")} ${attr(t, "costModel")}`;
    if (!terms.trim()) return { state: "unknown" };
    if (/gas fees?/i.test(terms)) return { state: "conflict", field: "entityAttributes.terms" };
    if (/freemium/i.test(terms)) return { state: "unknown", field: "entityAttributes.terms", detail: "freemium" };
    if (/\bfree\b|no paid|no cost|open source|public domain|cc0/i.test(terms)) return { state: "yes", field: "entityAttributes.terms" };
    if (/\b(paid|subscription|per (seat|user|month)|license fee|pricing)\b/i.test(terms)) return { state: "conflict", field: "entityAttributes.terms" };
    return { state: "unknown" };
  },
  server(t) {
    const d = textOf(t, ["deploymentOptions", "deploymentModel", "instanceServerRequirements", "terms"]);
    if (/no server( deployment)? (is )?required|official (server|instance)|free public instances?|\bsaas\b|hosted (service|version)|managed hosting|app stores?/i.test(d))
      return { state: "yes", field: "entityAttributes.deploymentOptions" };
    if (/self-host(ed|ing)? only|requires? (a |your own |its own )?server|must (run|host)/i.test(d)) return { state: "conflict", field: "entityAttributes.deploymentOptions" };
    return { state: "unknown" };
  },
  mobile(t) {
    const m = attr(t, "mobileSupport");
    if (!m || starts(m, /^n\/?a\b/i)) return { state: "unknown" };
    if (starts(m, /^(yes|native|ios|android|progressive web app|pwa|responsive|mobile-first)/i)) return { state: "yes", field: "entityAttributes.mobileSupport" };
    if (starts(m, /^(no|not yet|in development|planned|none)\b/i)) return { state: "conflict", field: "entityAttributes.mobileSupport" };
    return { state: "unknown" };
  },
  offline(t) {
    if (t.affordanceIds.includes("offline-mesh") || t.affordanceIds.includes("local-first-storage")) return { state: "yes", field: "affordanceIds" };
    const o = attr(t, "offlineCapabilities");
    if (starts(o, /^yes\b/i)) return { state: "yes", field: "entityAttributes.offlineCapabilities" };
    if (starts(o, /^(no|online-required|none)\b/i)) return { state: "conflict", field: "entityAttributes.offlineCapabilities" };
    return { state: "unknown" };
  },
  export(t) {
    if (t.affordanceIds.includes("data-portability")) return { state: "yes", field: "affordanceIds" };
    const dp = attr(t, "dataPortability"), w2 = attr(t, "web2DataExport");
    if (starts(dp, /^yes\b/i)) return { state: "yes", field: "entityAttributes.dataPortability" };
    if (starts(dp, /^(partial|limited)\b/i)) return { state: "unknown", field: "entityAttributes.dataPortability" };
    if (starts(w2, /^no\b/i) && !starts(dp, /^(yes|partial|limited)\b/i)) return { state: "conflict", field: "entityAttributes.web2DataExport" };
    if (starts(dp, /^no\b/i)) return { state: "conflict", field: "entityAttributes.dataPortability" };
    return { state: "unknown" };
  },
};

const fieldRef = (t: Tool, field?: string) => (field ? `${t.id}.${field}@${t.lastInvestigated}` : undefined);

const LIMIT_REASON: Record<Limit, string> = {
  crypto: "It needs tokens or a crypto wallet to use. You ruled out crypto.",
  cost: "It costs money to use. You ruled out cost.",
  server: "It needs a server your group would run. You ruled out running a server.",
  mobile: "It has no phone app yet. You need one.",
  offline: "It needs a steady internet connection. You need it to work on poor internet.",
  export: "Its data can't be exported. You need to be able to take your data out.",
};
const LIMIT_QUESTION: Record<Limit, string> = {
  crypto: "Does any part require tokens or a crypto wallet?",
  cost: "Is it free for a group your size, and will it stay free?",
  server: "Can your group use it without running a server?",
  mobile: "Does it work on members' phones?",
  offline: "Does it keep working on a poor connection?",
  export: "Can members export their data if the group leaves?",
};

export function toolView(t: Tool, now = Date.now()): ToolView {
  const reviewed = t.lastInvestigated;
  const age = (now - Date.parse(reviewed)) / 86_400_000;
  return {
    id: t.id,
    name: t.name,
    kindPlain: kindPlain(t.entityType),
    maturityPlain: maturityPlain(t.devStatusCode),
    takeoverRiskPlain: takeoverRiskPlain(t.captureRisk),
    reviewed,
    stale: Number.isFinite(age) && age > STALE_DAYS,
    url: `https://openhaven.net/protocols/${t.id}/`,
    actsAutomatically: t.entityType === "smart-contract-standard" || starts(attr(t, "smartContract"), /^yes\b/i),
  };
}

export type Excluded = { toolId: string; name: string; why: "limit" | "buildingBlock" | "notReady" | "noNeed"; reason: string; score: number };

export type Assessment = {
  columns: { id: string; label: string; group: "need" | "limit" }[];
  comparison: string[]; // alphabetical by name
  moreCount: number; // eligible options beyond the cap
  cells: Cell[];
  setAside: { toolId: string; reason: string }[];
  excluded: Excluded[]; // every candidate that is not in the comparison, with why
  notReady: { id: string; name: string }[];
  questions: { toolIds: string[] | "all"; question: string }[];
  needCounts: Record<string, number>;
  views: Record<string, ToolView>;
};

export function assess(candidates: Candidate[], profile: Profile, plan: Plan, weights: Weights, now = Date.now()): Assessment {
  const needCols = plan.needs.map((n) => ({ id: n.affordanceId, label: n.plain, group: "need" as const }));
  const limitCols = profile.limits.map((l) => ({ id: `limit.${l}`, label: LIMIT_LABEL[l], group: "limit" as const }));
  const developer = profile.setup === "developer";
  const plainNeed = new Map(plan.needs.map((n) => [n.affordanceId, n.plain]));

  const eligible: Candidate[] = [];
  const excluded: Excluded[] = [];
  const limitResults = new Map<string, Map<Limit, Check>>();

  for (const c of candidates) {
    const t = c.tool;
    const checks = new Map(profile.limits.map((l) => [l, CHECKS[l](t)] as const));
    limitResults.set(t.id, checks);
    const covers = c.covers.map((n) => plainNeed.get(n)!.replace(/[.\s]+$/, ""));
    const coversText = covers.length ? `Meets ${covers.length} of your ${plan.needs.length} needs: ${covers.join("; ")}. ` : "";
    if (!isReady(t.devStatusCode)) {
      excluded.push({ toolId: t.id, name: t.name, why: "notReady", reason: `${maturityPlain(t.devStatusCode)}.`, score: c.score });
      continue;
    }
    const conflicts = profile.limits.filter((l) => checks.get(l)!.state === "conflict");
    const isApp = APP_TYPES.has(t.entityType);
    if (!isApp && !developer) {
      const who = profile.setup === "guided" ? "You said the person setting it up can follow a guide, not build software." : "You said no one technical will set things up.";
      const also = conflicts.length ? " " + conflicts.map((l) => LIMIT_REASON[l]).join(" ") : "";
      excluded.push({ toolId: t.id, name: t.name, why: "buildingBlock", reason: `${coversText}It is a ${kindPlain(t.entityType).toLowerCase()}, not a ready-made app. ${who}${also}`, score: c.score });
      continue;
    }
    if (conflicts.length) {
      excluded.push({ toolId: t.id, name: t.name, why: "limit", reason: coversText + conflicts.map((l) => LIMIT_REASON[l]).join(" "), score: c.score });
      continue;
    }
    eligible.push(c);
  }

  // Cap by score, then show alphabetically.
  const shown = eligible.slice(0, COMPARISON_CAP).map((c) => c.tool).sort((a, b) => a.name.localeCompare(b.name));
  const comparison = shown.map((t) => t.id);

  const cells: Cell[] = [];
  for (const t of shown) {
    for (const n of plan.needs) {
      const yes = t.affordanceIds.includes(n.affordanceId);
      cells.push({ toolId: t.id, column: n.affordanceId, state: yes ? "yes" : "unknown", fieldRef: yes ? fieldRef(t, "affordanceIds") : undefined });
    }
    for (const l of profile.limits) {
      const r = limitResults.get(t.id)!.get(l)!;
      cells.push({ toolId: t.id, column: `limit.${l}`, state: r.state, fieldRef: r.state === "unknown" ? undefined : fieldRef(t, r.field) });
    }
  }

  // Set aside: apps that break a limit first (most informative), then building blocks; by score.
  const limitHits = excluded.filter((e) => e.why === "limit").sort((a, b) => b.score - a.score);
  const blocks = excluded.filter((e) => e.why === "buildingBlock").sort((a, b) => b.score - a.score);
  const setAside = [...limitHits.slice(0, SET_ASIDE_CAP - 1), ...blocks].slice(0, SET_ASIDE_CAP).map((e) => ({ toolId: e.toolId, reason: e.reason }));

  // Questions: every unknown on a limit column, merged across tools; plus leaning-driven questions.
  const qMap = new Map<string, string[]>();
  const add = (q: string, id: string) => qMap.set(q, [...(qMap.get(q) ?? []), id]);
  for (const t of shown) {
    for (const l of profile.limits) {
      const r = limitResults.get(t.id)!.get(l)!;
      if (r.state !== "unknown") continue;
      add(r.detail === "freemium" ? "Does the free tier cover what your group needs?" : LIMIT_QUESTION[l], t.id);
    }
    if (weights.flags.askAboutChangingRules) add("Can the group change its own decision rules without a developer?", t.id);
    if (weights.flags.judgementOverAutomation && toolView(t, now).actsAutomatically) add("Can people review a decision before it takes effect, or does it act automatically?", t.id);
  }
  const questions = [...qMap.entries()]
    .map(([question, ids]) => ({ question, toolIds: (ids.length === shown.length && shown.length > 1 ? "all" : ids) as string[] | "all" }))
    .sort((a, b) => (a.toolIds === "all" ? -1 : 0) - (b.toolIds === "all" ? -1 : 0) || (Array.isArray(b.toolIds) ? b.toolIds.length : 99) - (Array.isArray(a.toolIds) ? a.toolIds.length : 99));

  const needCounts = Object.fromEntries(plan.needs.map((n) => [n.affordanceId, shown.filter((t) => t.affordanceIds.includes(n.affordanceId)).length]));
  const notReady = excluded.filter((e) => e.why === "notReady" && e.score >= Math.min(...eligible.map((c) => c.score), Infinity)).slice(0, 5).map((e) => ({ id: e.toolId, name: e.name }));

  const views: Record<string, ToolView> = {};
  for (const c of candidates) if (comparison.includes(c.tool.id) || setAside.some((s) => s.toolId === c.tool.id)) views[c.tool.id] = toolView(c.tool, now);

  return { columns: [...needCols, ...limitCols], comparison, moreCount: Math.max(0, eligible.length - COMPARISON_CAP), cells, setAside, excluded, notReady, questions, needCounts, views };
}

export function joinList(xs: string[]): string {
  if (xs.length <= 1) return xs[0] ?? "";
  return `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
}
