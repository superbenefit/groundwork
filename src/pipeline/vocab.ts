import type { Limit, OtherField, Profile } from "../shared/schema";

/** Plain-language labels. Nothing on screen uses OpenHaven's own vocabulary. */

export function maturityPlain(code: number): string {
  if (code === 8) return "Early release";
  if (code === 9) return "In use";
  if (code === 10) return "Established";
  if (code === 11) return "Unmaintained";
  return "Not ready yet";
}
export const isReady = (code: number) => code >= 8 && code <= 10;

export function takeoverRiskPlain(risk: number): string {
  if (risk <= 2) return "Low risk";
  if (risk === 3) return "Moderate risk";
  return "High risk";
}

const KIND: Record<string, string> = {
  "d-app": "App",
  "ext-d-app": "App",
  "p2p-platform": "Platform",
  "p2p-protocol": "Protocol developers build on",
  "p2p-runtime": "Framework developers build on",
  "p2p-infrastructure": "Infrastructure",
  "federated-protocol": "Standard developers build on",
  "semantic-data": "Data standard",
  "identity-protocol": "Identity standard",
  "identity-platform": "Identity app",
  "identity-system": "Identity system",
  "standard-coordination": "Technical standard",
  "storage-network": "Storage network",
  "decentralized-data-protocol": "Data standard",
  "decentralized-monetary-protocol": "Way of handling money",
};
export const kindPlain = (entityType: string) => KIND[entityType] ?? "Tool";

/** Ready-made apps (PRD §7). Everything else is a building block. */
export const APP_TYPES = new Set(["d-app", "ext-d-app", "p2p-platform"]);

export const LIMIT_LABEL: Record<Limit, string> = {
  crypto: "No crypto",
  cost: "Free",
  server: "No server",
  mobile: "Phone",
  offline: "Poor internet",
  export: "Data export",
};
/** How a limit reads as a requirement, for model prompts. */
export const LIMIT_REQUIREMENT: Record<Limit, string> = {
  crypto: "no crypto or tokens",
  cost: "must be free",
  server: "no server to run",
  mobile: "must work on phones",
  offline: "must work on poor internet",
  export: "data must be exportable",
};

export const OPTIONS: Record<OtherField, Record<string, string>> = {
  scale: { solo: "Just me", team: "2 to 10 people", teams: "10 to 50 people", community: "50 to 500 people", network: "More than 500, or several groups" },
  reach: { members: "Only its own members", local: "One neighbourhood or town", regional: "A city or region", national: "A whole country", global: "People in several countries", online: "People online, anywhere" },
  decision: { single: "One person decides", consensus: "Discussion until everyone agrees", vote: "A vote", roles: "Each role decides its own area", board: "A board decides", unsettled: "It isn't settled yet" },
  limits: { crypto: "Needs crypto or tokens", cost: "Costs money", server: "Needs a server to run", mobile: "No phone app", offline: "Fails on poor internet", export: "Data can't be exported" },
  setup: { none: "No one technical", guided: "Someone who can follow a guide", developer: "A developer" },
  legal: { informal: "Informal, not a legal organization", nonprofit: "Nonprofit or charity", coop: "Co-op", company: "Company", unsure: "Not sure" },
};

export const SCALE_POLES = {
  speedSay: ["Quick decisions by a few", "Everyone has a say"],
  stableAdapt: ["Rules that stay put", "Rules that change"],
  autoJudge: ["Software enforces rules", "People use judgement"],
} as const;

export function leanLabel(scale: keyof typeof SCALE_POLES, value: number): string {
  if (value === 3) return "Balanced";
  return value < 3 ? SCALE_POLES[scale][0] : SCALE_POLES[scale][1];
}

/** The profile as plain text for model state and prompts. Limits are written as requirements. */
export function profileText(p: Profile, question: string): string {
  const other = Object.entries(p.other ?? {}).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("; ");
  const opt = (f: OtherField, v: string) => (v === "other" ? `other (${(p.other as Record<string, string | undefined>)?.[f] ?? "see free text"})` : OPTIONS[f][v] ?? v);
  return [
    `Group: ${p.name}. What it does: ${p.purpose || "not given"}.`,
    `People doing the work: ${opt("scale", p.scale)}. Who benefits: ${opt("reach", p.reach)}. Decisions today: ${opt("decision", p.decision)}.`,
    `Leanings, 1 to 5: ${SCALE_POLES.speedSay.join(" (1) vs ")} (5): ${p.leans.speedSay}; ${SCALE_POLES.stableAdapt.join(" (1) vs ")} (5): ${p.leans.stableAdapt}; ${SCALE_POLES.autoJudge.join(" (1) vs ")} (5): ${p.leans.autoJudge}.${p.leanNote ? ` Note: ${p.leanNote}` : ""}`,
    `Hard requirements: ${p.limits.length ? p.limits.map((l) => LIMIT_REQUIREMENT[l]).join("; ") : "none"}.`,
    `Who sets it up: ${opt("setup", p.setup)}. Legal form: ${opt("legal", p.legal)}.`,
    other ? `Free-text answers: ${other}.` : "",
    `Question: ${question}`,
  ]
    .filter(Boolean)
    .join("\n");
}
