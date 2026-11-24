import { Briefing, BLOCK_ORDER, type Cell } from "../shared/schema";
import { BANNED } from "./style";

export type ValidationContext = {
  /** Cells exactly as Assess produced them. */
  cells: Cell[];
  comparison: string[];
  setAside: string[];
  /** Names of every tool in OpenHaven, to catch prose that names a tool the briefing doesn't cover. */
  allToolNames: string[];
  /** Text the model was given; a tool name that appears there may be mentioned (e.g. a framework a tool is built on). */
  allowedText: string;
  /** Names of tools in this briefing (comparison + set aside). */
  briefingToolNames: string[];
};

const words = (s: string) => (s.trim().match(/\S+/g) ?? []).length;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Every human-readable string in the briefing, with a path for error messages. */
function prose(b: Briefing): [string, string][] {
  const out: [string, string][] = [["title", b.title], ...b.overview.map((p, i) => [`overview[${i}]`, p] as [string, string])];
  for (const [id, k] of Object.entries(b.kinds)) out.push([`kinds.${id}`, k]);
  for (const blk of b.blocks) {
    const at = blk.kind;
    if (blk.kind === "leanings") blk.items.forEach((x, i) => out.push([`${at}[${i}]`, x.implication]));
    if (blk.kind === "needs") blk.items.forEach((x, i) => out.push([`${at}[${i}]`, x.plain]));
    if (blk.kind === "howToChoose") blk.items.forEach((x, i) => out.push([`${at}[${i}].title`, x.title], [`${at}[${i}].body`, x.body]));
    if (blk.kind === "safeguards") blk.items.forEach((x, i) => out.push([`${at}[${i}]`, `${x.leaning} ${x.risk} ${x.safeguard}`]));
    if (blk.kind === "questions") blk.items.forEach((x, i) => out.push([`${at}[${i}]`, x.question]));
    if (blk.kind === "setAside") blk.items.forEach((x, i) => out.push([`${at}[${i}]`, x.reason]));
    if (blk.kind === "legal") {
      blk.paragraphs.forEach((p, i) => out.push([`${at}.paragraphs[${i}]`, p]));
      blk.related.forEach((r, i) => out.push([`${at}.related[${i}]`, r.note]));
    }
    if (blk.kind === "testReview") out.push([`${at}.steps`, blk.steps], ...blk.review.map((r, i) => [`${at}.review[${i}]`, r] as [string, string]));
  }
  return out;
}

/** Returns a list of plain error strings; empty means valid. */
export function validateBriefing(input: unknown, ctx: ValidationContext): string[] {
  const parsed = Briefing.safeParse(input);
  if (!parsed.success) return parsed.error.issues.map((i) => `schema: ${i.path.join(".")}: ${i.message}`);
  const b = parsed.data;
  const errors: string[] = [];

  // Block order.
  const order = b.blocks.map((x) => BLOCK_ORDER.indexOf(x.kind));
  if (order.some((v, i) => i > 0 && v <= order[i - 1]!)) errors.push(`blocks out of order: ${b.blocks.map((x) => x.kind).join(", ")}`);

  // Tool ids and cells.
  const allowedIds = new Set([...ctx.comparison, ...ctx.setAside]);
  for (const blk of b.blocks) {
    if (blk.kind === "comparison") {
      if (blk.toolIds.join() !== ctx.comparison.join()) errors.push("comparison tool list differs from Assess");
      const want = new Map(ctx.cells.map((c) => [`${c.toolId}|${c.column}`, c.state]));
      if (blk.cells.length !== ctx.cells.length) errors.push("comparison cell count differs from Assess");
      for (const c of blk.cells) if (want.get(`${c.toolId}|${c.column}`) !== c.state) errors.push(`cell ${c.toolId}/${c.column} differs from Assess`);
    }
    if (blk.kind === "setAside") for (const s of blk.items) if (!allowedIds.has(s.toolId)) errors.push(`set-aside tool ${s.toolId} was not retrieved`);
    if (blk.kind === "questions") for (const q of blk.items) if (q.toolIds !== "all") for (const id of q.toolIds) if (!allowedIds.has(id)) errors.push(`question names tool ${id} that was not retrieved`);
  }
  for (const id of Object.keys(b.kinds)) if (!allowedIds.has(id)) errors.push(`kind given for tool ${id} that was not retrieved`);

  // Banned words everywhere.
  for (const [path, text] of prose(b)) for (const { re, label } of BANNED) if (re.test(text)) errors.push(`${path} uses ${label}`);

  // Title.
  const t = b.title.trim();
  if (t.endsWith("?")) errors.push("title ends with a question mark");
  if (/your question|this question|\bthis\b/i.test(t)) errors.push("title refers back to the question");
  if (t.length > 80) errors.push("title is longer than 80 characters");
  if (ctx.briefingToolNames.some((n) => new RegExp(`\\b${esc(n)}\\b`, "i").test(t))) errors.push("title contains a tool name");

  // Overview.
  if (b.overview.length > 2) errors.push("overview has more than 2 paragraphs");
  if (words(b.overview.join(" ")) > 120) errors.push(`overview is ${words(b.overview.join(" "))} words (max 120)`);

  // Tools named in prose that the briefing doesn't cover and the model wasn't given.
  const named = new Set(ctx.briefingToolNames);
  const candidates = ctx.allToolNames.filter((n) => n.length >= 4 && !named.has(n) && !ctx.allowedText.includes(n));
  const all = prose(b).map(([, s]) => s).join("\n");
  for (const n of candidates) if (new RegExp(`\\b${esc(n)}\\b`).test(all)) errors.push(`prose names ${n}, which is not in the briefing`);

  return errors;
}
