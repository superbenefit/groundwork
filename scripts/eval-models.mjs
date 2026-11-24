// M0 model eval, round 2: picks (capability selection) and writing (queries, notes, chat).
// Calls the preview's /api/m0/run passthrough, which runs env.AI.run through the groundwork gateway.
// Usage: node scripts/eval-models.mjs [previewBase] [outDir]
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { PERSONAS } from "../src/eval/personas.ts";
import { GOLD } from "./eval-gold.mjs";

const BASE = process.argv[2] ?? "https://m0-spike-groundwork.superbenefit.workers.dev";
const OUT = process.argv[3] ?? "eval-out";
const OH = "https://openhaven.net/api";

// $ per million tokens, from developers.cloudflare.com (checked Nov 24, 2026).
const PRICE = {
  "@cf/google/gemma-4-26b-a4b-it": { in: 0.1, out: 0.3 },
  "@cf/qwen/qwen3.8-27b": { in: 0.45, out: 3.2 },
  "@cf/cloudflare/clef": { in: 0.24, out: 0 },
  "@cf/cloudflare/clef-flash": { in: 0.038, out: 0 },
  "@cf/cloudflare/clairic": { in: 0.24, out: 0, note: "0.10 promo until Dec 1, 2026" },
  "@cf/deepseek-ai/deepseek-v4.1-flash-1017": { in: 0.3, out: 1.2 },
  "@cf/thinkingmachines/inkling-2-small": { in: 0.3, out: 1.0 },
};
const short = (m) => m.split("/").pop();

const affordances = await (await fetch(`${OH}/affordances.json`)).json();
const tools = await (await fetch(`${OH}/protocols.json`)).json();
const AFF_IDS = affordances.map((a) => a.id);

async function run(model, input) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await fetch(`${BASE}/api/m0/run`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ model, input }) });
    const j = await r.json().catch(() => ({ ok: false, error: `HTTP ${r.status}` }));
    if (j.ok || attempt === 1) return j;
  }
}
function cost(model, usage = {}) {
  const p = PRICE[model];
  const tin = usage.prompt_tokens ?? usage.input_tokens ?? 0;
  const tout = usage.completion_tokens ?? usage.output_tokens ?? 0;
  return { tin, tout, usd: (tin * p.in + tout * p.out) / 1e6 };
}
const noThink = (model) =>
  model.includes("deepseek") ? { reasoning_effort: "none" } : { chat_template_kwargs: { enable_thinking: false } };
const thinkLow = (model) => ({ reasoning_effort: "low" });

function profileText(p, q) {
  const P = p.profile;
  const other = Object.entries(P.other ?? {}).map(([k, v]) => `${k}: ${v}`).join("; ");
  return [
    `Group: ${P.name}. Purpose: ${P.purpose}.`,
    `Size: ${P.scale}. Reach: ${P.reach}. Decisions: ${P.decision}.`,
    `Leanings (1-5): quick decisions by a few (1) vs everyone has a say (5): ${P.leans.speedSay}; rules that stay put (1) vs rules that change (5): ${P.leans.stableAdapt}; software enforces (1) vs people use judgement (5): ${P.leans.autoJudge}.`,
    `Rules out: ${P.limits.length ? P.limits.join(", ") : "nothing"}. Setup ability: ${P.setup}. Legal form: ${P.legal}.`,
    other ? `Free-text answers: ${other}.` : "",
    `Question: ${q}`,
  ].filter(Boolean).join("\n");
}

// ---------- Picks ----------
function scorePicks(id, picks) {
  const g = GOLD[id];
  const good = new Set([...g.must, ...g.ok]);
  const mustHit = g.must.filter((m) => picks.includes(m)).length;
  return {
    mustRecall: mustHit / g.must.length,
    precision: picks.length ? picks.filter((p) => good.has(p)).length / picks.length : 0,
    offTarget: picks.filter((p) => !good.has(p)),
  };
}
const capList = affordances.map((a) => `- ${a.id}: ${a.name}. ${a.description}`).join("\n");

async function picksLLM(model, persona) {
  const schema = { type: "object", properties: { needs: { type: "array", items: { type: "string", enum: AFF_IDS }, minItems: 2, maxItems: 5 } }, required: ["needs"] };
  const r = await run(model, {
    messages: [
      { role: "system", content: "Pick the 2 to 5 software capabilities this group needs to answer its question. Use only ids from the list. Order by importance." },
      { role: "user", content: `Capabilities:\n${capList}\n\n${profileText(persona, persona.question)}` },
    ],
    response_format: { type: "json_schema", json_schema: schema },
    temperature: 0.2,
    ...noThink(model),
  });
  if (!r.ok) return { error: r.error, ms: r.ms };
  const c = r.result.choices?.[0]?.message?.content ?? r.result.response;
  const parsed = typeof c === "string" ? JSON.parse(c) : c;
  return { picks: parsed.needs.filter((n) => AFF_IDS.includes(n)), ms: r.ms, ...cost(model, r.result.usage) };
}
function rank(scored) {
  const yes = scored.filter((s) => s.p >= 0.5).sort((a, b) => b.p - a.p).slice(0, 5);
  return (yes.length >= 2 ? yes : [...scored].sort((a, b) => b.p - a.p).slice(0, 2)).map((s) => s.id);
}
async function picksClef(model, persona) {
  const questions = Object.fromEntries(affordances.map((a) => [a.id, { type: "noul", instructions: `Does this group need this capability to act on its question? ${a.name}: ${a.description}` }]));
  const r = await run(model, { model: short(model), state: profileText(persona, persona.question), questions });
  if (!r.ok) return { error: r.error, ms: r.ms };
  const scored = Object.entries(r.result.answers).map(([id, a]) => ({ id, p: a.noul }));
  return { picks: rank(scored), ms: r.ms, ...cost(model, r.result.usage) };
}
async function picksClairic(model, persona) {
  const fields = Object.fromEntries(affordances.map((a) => [a.id.replace(/-/g, "_"), { type: "boolean", instructions: `Does this group need this capability to act on its question? ${a.name}: ${a.description}` }]));
  const r = await run(model, { model: "clairic", state: profileText(persona, persona.question), fields });
  if (!r.ok) return { error: r.error, ms: r.ms };
  const scored = Object.entries(r.result.answers).map(([k, a]) => ({ id: k.replace(/_/g, "-"), p: a.value === true ? a.confidence : a.value === false ? 1 - a.confidence : 0 }));
  return { picks: rank(scored), ms: r.ms, ...cost(model, r.result.usage) };
}

// ---------- Writing ----------
const BANNED = /\bbest\b|\brecommend|\bwe\b|\bour\b|\bus\b|you should use|the right tool|perfect for/i;
const JARGON = /\baffordance|entity type|capture risk|\brecord\b/i;
const words = (s) => (s.trim().match(/\S+/g) ?? []).length;
const tok = (s) => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];
const STOP = new Set("a an and or the of for to in on with without by is are be that this tool tools app apps software platform".split(" "));
function search(q) {
  const qs = tok(q).filter((t) => !STOP.has(t));
  return tools
    .map((t) => {
      const hay = new Set(tok(`${t.name} ${t.description} ${(t.searchKeywords ?? []).join(" ")}`));
      return { t, s: qs.filter((x) => hay.has(x)).length };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 10)
    .map((x) => x.t);
}

async function chat(model, system, user, extra = {}, mode = "off") {
  const r = await run(model, {
    messages: [{ role: "system", content: system }, { role: "user", content: user }],
    temperature: 0.3,
    ...(mode === "low" ? thinkLow(model) : noThink(model)),
    ...extra,
  });
  if (!r.ok) return { error: r.error, ms: r.ms };
  const c = r.result.choices?.[0]?.message?.content ?? r.result.response ?? "";
  return { text: typeof c === "string" ? c : JSON.stringify(c), ms: r.ms, ...cost(model, r.result.usage) };
}

const STYLE = [
  "Address the reader as you and your group. Never use we, our or us.",
  "Plain words only. Never say affordance, entity type, capture risk, record or protocol; say takeover risk, maturity, reviewed.",
  "State facts directly, one idea per sentence, no preamble, no hedging adjectives.",
  "Never recommend, rank or call anything best. Present options and trade-offs.",
].join("\n");

async function taskQueries(model, persona) {
  const schema = { type: "object", properties: { restatement: { type: "string" }, queries: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 } }, required: ["restatement", "queries"] };
  const r = await chat(
    model,
    `Write search queries for a directory of open, decentralized software tools.\nReturn a one-sentence restatement of what the group needs (under 20 words, addressed to "your group"), and exactly 3 keyword queries of 2 to 5 words each that would find matching tools by name, description or keywords.\n${STYLE}`,
    profileText(persona, persona.question),
    { response_format: { type: "json_schema", json_schema: schema } },
  );
  if (r.error) return r;
  let j;
  try { j = JSON.parse(r.text); } catch { return { ...r, error: "invalid JSON" }; }
  const g = GOLD[persona.id];
  const good = new Set([...g.must, ...g.ok]);
  const perQuery = j.queries.map((q) => {
    const hits = search(q);
    return { q, hits: hits.length, relevant: hits.filter((t) => t.affordanceIds.some((a) => good.has(a))).length };
  });
  const totalHits = perQuery.reduce((s, x) => s + x.hits, 0);
  return {
    ...r,
    out: j,
    hitRate: totalHits ? perQuery.reduce((s, x) => s + x.relevant, 0) / totalHits : 0,
    emptyQueries: perQuery.filter((x) => x.hits === 0).length,
    rules: [BANNED.test(j.restatement) && "banned", JARGON.test(j.restatement) && "jargon", words(j.restatement) > 20 && "long", j.queries.some((q) => words(q) > 5) && "query>5w"].filter(Boolean),
  };
}

async function taskNote(model, persona, field, value) {
  const r = await chat(
    model,
    `A group answered a setup question with free text. Write one note, at most 25 words, saying what the answer means for choosing software. Address the group as "your group". Output only the note.\n${STYLE}`,
    `${profileText(persona, persona.question)}\n\nField: ${field}\nFree-text answer: ${value}`,
  );
  if (r.error) return r;
  return { ...r, rules: [BANNED.test(r.text) && "banned", JARGON.test(r.text) && "jargon", words(r.text) > 25 && `long(${words(r.text)})`].filter(Boolean) };
}

const CTX_TOOLS = ["bonfire-networks", "group-income", "hypha", "moss"].map((id) => tools.find((t) => t.id === id));
const OTHER_NAMES = tools.filter((t) => !CTX_TOOLS.includes(t) && t.name.length >= 5).map((t) => t.name);
function toolFacts(t) {
  return [
    `${t.name}: ${t.description.replace(/\[[a-z]\]/g, "").slice(0, 420)}`,
    `  Maturity: ${t.devStatus.replace(/\[[a-z]\]/g, "").slice(0, 160)}`,
    `  Takeover risk: ${["", "low", "low", "moderate", "high", "high"][t.captureRisk]} (${t.captureRisk}/5). ${String(t.captureRiskReasoning ?? "").replace(/\[[a-z]\]/g, "").slice(0, 260)}`,
    `  License: ${String(t.license).slice(0, 80)}. Stack: ${String(t.stack).slice(0, 160)}`,
    `  Reviewed: ${t.lastInvestigated}`,
  ].join("\n");
}
const BRIEFING = [
  "Group: Riverside Tool Library, 2 to 10 people, one neighbourhood, decides by agreement. Rules out crypto, cost and running a server. No setup skills.",
  "Briefing title: Tools for member voting and open spending.",
  "Options in the briefing (alphabetical):",
  ...CTX_TOOLS.map(toolFacts),
].join("\n");
const CHAT_SYSTEM = [
  "Answer questions about this group's briefing.",
  "Method: answer in the first word or sentence (for example \"No.\" or \"Yes, with one condition.\"). Then give the evidence and its review date. Then say what is unknown.",
  "Use only the facts below. If the facts do not answer the question, say it is not known from the briefing.",
  "At most 120 words.",
  STYLE,
  "",
  BRIEFING,
].join("\n");
const CHAT_QS = [
  { q: "Can we use Moss without running our own server?", dated: true },
  { q: "Which of these work on a phone?", dated: false },
  { q: "Is Group Income free to use?", dated: true },
  { q: "What is the takeover risk for Hypha, and why?", dated: true },
  { q: "Which tool is best for us?", dated: false, trap: "best" },
  { q: "Does Bonfire support secret ballots?", dated: false, trap: "unknown" },
];
async function taskChat(model, item, mode) {
  const r = await chat(model, CHAT_SYSTEM, item.q, {}, mode);
  if (r.error) return r;
  const t = r.text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  const first = t.split(/(?<=[.!?])\s/)[0] ?? "";
  const invented = OTHER_NAMES.filter((n) => new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(t));
  const rules = [
    BANNED.test(t) && "banned",
    JARGON.test(t) && "jargon",
    words(t) > 120 && `long(${words(t)})`,
    words(first) > 10 && "not-answer-first",
    item.dated && !/20\d\d/.test(t) && "no-date",
    item.trap === "unknown" && !/not (known|stated|listed|say|mention)|unknown|doesn't say|does not say|no information/i.test(t) && "claims-knowledge",
    invented.length && `other-tools(${invented.slice(0, 3).join(",")})`,
  ].filter(Boolean);
  return { ...r, text: t, rules };
}

// ---------- Run ----------
await mkdir(OUT, { recursive: true });
const PICK_MODELS = [
  ["@cf/google/gemma-4-26b-a4b-it", picksLLM],
  ["@cf/qwen/qwen3.8-27b", picksLLM],
  ["@cf/cloudflare/clef", picksClef],
  ["@cf/cloudflare/clef-flash", picksClef],
  ["@cf/cloudflare/clairic", picksClairic],
];
const WRITE_MODELS = ["@cf/deepseek-ai/deepseek-v4.1-flash-1017", "@cf/thinkingmachines/inkling-2-small", "@cf/google/gemma-4-26b-a4b-it", "@cf/qwen/qwen3.8-27b"];
const OTHER_ITEMS = PERSONAS.flatMap((p) => Object.entries(p.profile.other ?? {}).map(([f, v]) => ({ p, f, v })));

const picks = {}, writing = {};
await Promise.all([
  ...PICK_MODELS.map(async ([m, fn]) => {
    picks[m] = [];
    for (const p of PERSONAS) {
      const r = await fn(m, p);
      picks[m].push({ persona: p.id, ...r, ...(r.picks ? scorePicks(p.id, r.picks) : {}) });
      console.error(`picks ${short(m)} ${p.id} ${r.error ?? r.picks?.join(",")}`);
    }
  }),
  ...WRITE_MODELS.map(async (m) => {
    writing[m] = { queries: [], notes: [], chat: [], chatLow: [] };
    for (const p of PERSONAS) writing[m].queries.push({ persona: p.id, ...(await taskQueries(m, p)) });
    for (const o of OTHER_ITEMS) writing[m].notes.push({ persona: o.p.id, field: o.f, ...(await taskNote(m, o.p, o.f, o.v)) });
    for (const c of CHAT_QS) writing[m].chat.push({ q: c.q, ...(await taskChat(m, c, "off")) });
    if (!m.includes("gemma")) for (const c of CHAT_QS) writing[m].chatLow.push({ q: c.q, ...(await taskChat(m, c, "low")) });
    console.error(`writing ${short(m)} done`);
  }),
]);
await writeFile(`${OUT}/raw.json`, JSON.stringify({ picks, writing, price: PRICE }, null, 2));

// ---------- Summaries ----------
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const p50 = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] ?? 0; };
const pct = (x) => `${Math.round(x * 100)}%`;
const usd = (x) => `$${(x * 1000).toFixed(3)}`;
const lines = ["## Picks", "", "| Model | Errors | Core needs found | Precision | p50 latency | max latency | Cost per 1,000 runs |", "|---|---|---|---|---|---|---|"];
for (const [m] of PICK_MODELS) {
  const rs = picks[m], ok = rs.filter((r) => r.picks);
  lines.push(`| ${short(m)} | ${rs.length - ok.length} | ${pct(mean(ok.map((r) => r.mustRecall)))} | ${pct(mean(ok.map((r) => r.precision)))} | ${(p50(ok.map((r) => r.ms)) / 1000).toFixed(1)} s | ${(Math.max(...ok.map((r) => r.ms)) / 1000).toFixed(1)} s | ${usd(mean(ok.map((r) => r.usd)))} |`);
}
lines.push("", "| Persona | " + PICK_MODELS.map(([m]) => short(m)).join(" | ") + " |", "|---|" + PICK_MODELS.map(() => "---").join("|") + "|");
for (const p of PERSONAS) lines.push(`| ${p.id} | ` + PICK_MODELS.map(([m]) => { const r = picks[m].find((x) => x.persona === p.id); return r.picks ? r.picks.join(", ") + (r.offTarget.length ? ` (off: ${r.offTarget.join(", ")})` : "") : `error: ${String(r.error).slice(0, 60)}`; }).join(" | ") + " |");
lines.push("", "## Writing", "", "| Model | Query hit rate | Empty queries | Query rule breaks | Note rule breaks | Chat rule breaks (off) | Chat rule breaks (low) | p50 chat latency | Cost per 1,000 chat turns |", "|---|---|---|---|---|---|---|---|---|");
for (const m of WRITE_MODELS) {
  const w = writing[m], q = w.queries.filter((r) => !r.error);
  const breaks = (arr) => `${arr.filter((r) => r.error || r.rules?.length).length}/${arr.length}`;
  lines.push(`| ${short(m)} | ${pct(mean(q.map((r) => r.hitRate)))} | ${q.reduce((s, r) => s + r.emptyQueries, 0)}/${q.length * 3} | ${breaks(w.queries)} | ${breaks(w.notes)} | ${breaks(w.chat)} | ${w.chatLow.length ? breaks(w.chatLow) : "–"} | ${(p50(w.chat.filter((r) => !r.error).map((r) => r.ms)) / 1000).toFixed(1)} s | ${usd(mean(w.chat.filter((r) => !r.error).map((r) => r.usd)))} |`);
}
lines.push("", "### Rule breaks", "");
for (const m of WRITE_MODELS) for (const k of ["queries", "notes", "chat", "chatLow"]) for (const r of writing[m][k]) if (r.error || r.rules?.length) lines.push(`- ${short(m)} ${k} ${r.persona ?? r.q}: ${r.error ?? r.rules.join(", ")}`);
lines.push("", "### Samples", "");
for (const m of WRITE_MODELS) {
  lines.push(`#### ${short(m)}`, "");
  for (const r of writing[m].notes) lines.push(`- Note (${r.persona}, ${r.field}): ${r.text ?? r.error}`);
  for (const r of writing[m].queries.slice(0, 3)) lines.push(`- Queries (${r.persona}): ${r.out ? r.out.queries.join(" · ") + ` — "${r.out.restatement}"` : r.error}`);
  for (const r of writing[m].chat) lines.push(`- Q: ${r.q}\n  A: ${(r.text ?? r.error).replace(/\n+/g, " ")}`);
  lines.push("");
}
await writeFile(`${OUT}/summary.md`, lines.join("\n"));
console.log(lines.join("\n"));
