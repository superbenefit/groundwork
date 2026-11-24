import type { Affordance, Mechanism, OrgType, SnapshotFiles, Tool } from "./types";

/** Drop translated copies of every field (name_es, desc_ptBR, …) to cut size roughly in half. */
export function stripLocales<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (k, v) => (/_(es|pt-?BR)$/.test(k) ? undefined : v)));
}

export type Snapshot = {
  fetchedAt: string;
  tools: Tool[];
  affordances: Affordance[];
  orgTypes: OrgType[];
  mechanisms: Mechanism[];
  byId: Map<string, Tool>;
  byAffordance: Map<string, Tool[]>;
  affordanceById: Map<string, Affordance>;
};

export function buildSnapshot(files: SnapshotFiles, fetchedAt: string): Snapshot {
  const tools = files.protocols;
  const byAffordance = new Map<string, Tool[]>();
  for (const t of tools) for (const a of t.affordanceIds ?? []) byAffordance.set(a, [...(byAffordance.get(a) ?? []), t]);
  return {
    fetchedAt,
    tools,
    affordances: files.affordances,
    orgTypes: files["organization-types"],
    mechanisms: files["monetary-architecture"],
    byId: new Map(tools.map((t) => [t.id, t])),
    byAffordance,
    affordanceById: new Map(files.affordances.map((a) => [a.id, a])),
  };
}
