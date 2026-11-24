// Runs the full pipeline for every eval persona (plus the mockup's Riverside) on a Preview and
// writes a report: timing, validator outcome, picks and the composed text for review.
// Usage: node evals/briefings.mjs [previewBase] [outFile]
import { writeFile } from "node:fs/promises";
import { PERSONAS } from "./personas.ts";

const BASE = process.argv[2];
if (!BASE) { console.error("Usage: node " + process.argv[1].split("/").pop() + " <preview url> [out file]"); process.exit(1); }
const OUT = process.argv[3] ?? "briefings.md";
const RIVERSIDE = {
  id: "riverside-mockup",
  question: "How can members vote on what we buy and see where the money goes, without needing a crypto wallet?",
  profile: { name: "Riverside Tool Library", purpose: "We lend tools to neighbours so people don't each buy their own, and run a monthly repair night.", scale: "team", reach: "local", decision: "consensus", leans: { speedSay: 4, stableAdapt: 4, autoJudge: 4 }, limits: ["crypto", "cost", "export"], setup: "none", legal: "nonprofit" },
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runOne(p) {
  const start = await (await fetch(`${BASE}/api/dev/brief`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ profile: p.profile, question: p.question }) })).json();
  if (!start.name) return { persona: p.id, error: JSON.stringify(start).slice(0, 300) };
  for (let i = 0; i < 120; i++) {
    await sleep(2000);
    const s = await (await fetch(`${BASE}/api/dev/brief/${encodeURIComponent(start.name)}`)).json();
    if (s.phase === "done" || s.phase === "failed") return { persona: p.id, ...s };
  }
  return { persona: p.id, error: "timed out" };
}

const results = [];
for (const p of [RIVERSIDE, ...PERSONAS]) {
  const r = await runOne(p);
  results.push(r);
  console.error(`${p.id}: ${r.phase ?? r.error} ${r.diagnostics?.ms ?? ""}ms ${r.briefing?.composedBy ?? ""}`);
  await sleep(4000); // stay under DeepSeek's 20 requests per minute
}

const L = ["# Briefing runs", "", `Preview: ${BASE}`, "", "| Persona | Result | Time | Composed by | Compose attempts | Needs | Options | Set aside |", "|---|---|---|---|---|---|---|---|"];
for (const r of results) {
  const b = r.briefing;
  const cmp = b?.blocks.find((x) => x.kind === "comparison");
  L.push(`| ${r.persona} | ${r.phase ?? r.error} | ${r.diagnostics ? (r.diagnostics.ms / 1000).toFixed(1) + " s" : ""} | ${b?.composedBy ?? ""} | ${r.diagnostics?.composeAttempts.length ?? ""} | ${r.plan?.needs.map((n) => n.affordanceId).join(", ") ?? ""} | ${cmp?.toolIds.join(", ") ?? "none"} | ${b?.blocks.find((x) => x.kind === "setAside")?.items.map((i) => i.toolId).join(", ") ?? ""} |`);
}
for (const r of results) {
  const b = r.briefing;
  L.push("", `## ${r.persona}`, "");
  if (!b) { L.push(`Failed: ${r.error}`); continue; }
  for (const a of r.diagnostics?.composeAttempts ?? []) if (a.errors.length) L.push(`- Rejected attempt: ${a.errors.join("; ")}`);
  L.push(`**${b.title}**`, "", ...b.overview.map((p) => `> ${p}`), "");
  for (const n of r.plan.needs) L.push(`- Need: ${n.plain} (${n.affordanceId}, p=${n.p})`);
  for (const m of r.plan.otherMappings) L.push(`- Other (${m.field} → ${m.mappedTo ?? "none"}): ${m.note}`);
  for (const blk of b.blocks) {
    if (blk.kind === "leanings") blk.items.forEach((i) => L.push(`- Leaning ${i.scale}=${i.value}: ${i.implication}`));
    if (blk.kind === "howToChoose") blk.items.forEach((i) => L.push(`- How to choose — ${i.title}: ${i.body}`));
    if (blk.kind === "safeguards") blk.items.forEach((i) => L.push(`- Safeguard — ${i.leaning}: ${i.risk} → ${i.safeguard}`));
    if (blk.kind === "questions") blk.items.forEach((i) => L.push(`- Question (${i.toolIds === "all" ? "all" : i.toolIds.join(", ")}): ${i.question}`));
    if (blk.kind === "setAside") blk.items.forEach((i) => L.push(`- Set aside ${i.toolId}: ${i.reason}`));
    if (blk.kind === "legal") blk.paragraphs.forEach((p) => L.push(`- Legal: ${p}`));
  }
  L.push(`- Kinds: ${Object.entries(b.kinds).map(([k, v]) => `${k}=${v}`).join("; ")}`);
}
await writeFile(OUT, L.join("\n"));
console.log(L.slice(0, 20).join("\n"));
