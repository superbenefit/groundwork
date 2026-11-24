// Writes a dated, locale-stripped OpenHaven snapshot to fixtures/openhaven/ for tests and offline dev.
// Usage: npm run snapshot
import { mkdir, writeFile } from "node:fs/promises";

const API = "https://openhaven.net/api";
const FILES = ["protocols", "affordances", "domains", "entity-types", "organization-types", "monetary-architecture"];
const strip = (v) => JSON.parse(JSON.stringify(v, (k, x) => (/_(es|pt-?BR)$/.test(k) ? undefined : x)));

await mkdir("fixtures/openhaven", { recursive: true });
for (const name of FILES) {
  const res = await fetch(`${API}/${name}.json`);
  if (!res.ok) throw new Error(`${name}: ${res.status}`);
  await writeFile(`fixtures/openhaven/${name}.json`, JSON.stringify(strip(await res.json())));
}
await writeFile("fixtures/openhaven/meta.json", JSON.stringify({ fetchedAt: new Date().toISOString(), source: API, license: "CC BY-SA 4.0" }, null, 2));
console.log("fixtures/openhaven written");
