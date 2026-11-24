import { buildSnapshot, stripLocales, type Snapshot } from "./snapshot";
import { SNAPSHOT_FILES, type SnapshotFiles, type SnapshotName } from "./types";

/**
 * KV-backed snapshot of OpenHaven's static JSON API (SPEC §9.1).
 * Keys: oh:<name>:<fetchedAt> (gzipped, locale-stripped JSON), then oh:current written last.
 */
type Pointer = { fetchedAt: string; names: SnapshotName[] };

async function gzip(text: string): Promise<ArrayBuffer> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Response(stream).arrayBuffer();
}
async function gunzip(buf: ArrayBuffer): Promise<string> {
  const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}

export async function refreshSnapshot(env: Env): Promise<Pointer> {
  const fetchedAt = new Date().toISOString();
  const bodies = await Promise.all(
    SNAPSHOT_FILES.map(async (name) => {
      const res = await fetch(`${env.OPENHAVEN_API}/${name}.json`, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`OpenHaven ${name}.json returned ${res.status}`);
      return [name, JSON.stringify(stripLocales(await res.json()))] as const;
    }),
  );
  // Write every file first; the pointer last, so readers never see a partial snapshot.
  const ttl = 60 * 60 * 24 * 8;
  await Promise.all(bodies.map(async ([name, text]) => env.OH_CACHE.put(`oh:${name}:${fetchedAt}`, await gzip(text), { expirationTtl: ttl })));
  const pointer: Pointer = { fetchedAt, names: [...SNAPSHOT_FILES] };
  await env.OH_CACHE.put("oh:current", JSON.stringify(pointer));
  memo = undefined;
  return pointer;
}

let memo: { fetchedAt: string; snapshot: Snapshot } | undefined;

/** Loads the current snapshot once per isolate; refreshes on demand if KV has none. */
export async function loadSnapshot(env: Env): Promise<Snapshot> {
  let pointer = await env.OH_CACHE.get<Pointer>("oh:current", "json");
  if (!pointer) pointer = await refreshSnapshot(env);
  if (memo?.fetchedAt === pointer.fetchedAt) return memo.snapshot;
  const files = {} as Record<string, unknown>;
  await Promise.all(
    (["protocols", "affordances", "domains", "entity-types", "organization-types", "monetary-architecture"] as const).map(async (name) => {
      const buf = await env.OH_CACHE.get(`oh:${name}:${pointer!.fetchedAt}`, "arrayBuffer");
      if (!buf) throw new Error(`snapshot file ${name} missing for ${pointer!.fetchedAt}`);
      files[name] = JSON.parse(await gunzip(buf));
    }),
  );
  const snapshot = buildSnapshot(files as SnapshotFiles, pointer.fetchedAt);
  memo = { fetchedAt: pointer.fetchedAt, snapshot };
  return snapshot;
}

export async function snapshotDate(env: Env): Promise<string | null> {
  return (await env.OH_CACHE.get<Pointer>("oh:current", "json"))?.fetchedAt ?? null;
}
