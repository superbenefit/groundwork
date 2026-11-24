import { tool, type ToolSet } from "ai";
import { z } from "zod";
import { loadSnapshot } from "../openhaven/cache";
import { STYLE_RULES } from "../pipeline/style";
import { maturityPlain, takeoverRiskPlain } from "../pipeline/vocab";
import type { Tool } from "../openhaven/types";

/** Follow-up chat system prompt (SPEC §10.2). The facts are the same ones the briefing was written from. */
export function followUpPrompt(facts: string | undefined, title: string | undefined): string {
  return [
    "You answer a group's follow-up questions about its briefing on software tools.",
    "Method:",
    "1. Answer in the first word or sentence (for example \"No.\", \"Yes, with one condition.\", \"Not known from the briefing.\").",
    "2. Give the evidence, with its review date.",
    "3. Say what is still unknown.",
    "Use the briefing facts below first. To look up a tool that is not in the facts, use the OpenHaven tools (names starting tool_openhaven_); if they fail, use the oh_ tools, which read the same data.",
    "When your answer is about one option in the comparison, call highlight with its tool id before you write anything; never mention that you did.",
    "Write one answer. After any tool call, do not add a second answer or a \"To add\" section.",
    "Call the sources \"its profile\" or \"the reviewed profile\". Never say OpenHaven, record, entry or database.",
    "At most 120 words unless the person asks for more. Short paragraphs, no headings, no lists longer than four items.",
    "Never say which option to choose, try or start with first.",
    STYLE_RULES,
    "",
    `BRIEFING: ${title ?? "(not written yet)"}`,
    facts ?? "(The briefing is not ready yet. Say so and offer to answer once it is.)",
  ].join("\n");
}

const clean = (s: string) => s.replace(/\s*\[[a-z]\](\[[a-z]\])*/g, "").replace(/\s+/g, " ").trim();
const card = (t: Tool) => ({
  id: t.id,
  name: t.name,
  description: clean(t.description).slice(0, 500),
  maturity: maturityPlain(t.devStatusCode),
  takeoverRisk: `${takeoverRiskPlain(t.captureRisk)} — ${clean(t.captureRiskReasoning ?? "").slice(0, 300)}`,
  reviewed: t.lastInvestigated,
  details: Object.fromEntries(
    ["terms", "deploymentOptions", "mobileSupport", "webSupport", "offlineCapabilities", "dataPortability", "web2DataExport", "governanceDecisionMaking"]
      .map((k) => [k, t.entityAttributes?.[k]])
      .filter(([, v]) => v)
      .map(([k, v]) => [k, clean(String(v)).slice(0, 240)]),
  ),
  url: `https://openhaven.net/protocols/${t.id}/`,
});

/** Tools for the chat: highlight (server-side, the page reacts to state) and local OpenHaven fallbacks. */
export function chatTools(env: Env, onHighlight: (toolId: string) => void): ToolSet {
  return {
    highlight: tool({
      description: "Point the page at one option in the comparison. Use the tool id from the briefing facts.",
      inputSchema: z.object({ toolId: z.string() }),
      execute: async ({ toolId }) => {
        onHighlight(toolId);
        return { ok: true };
      },
    }),
    oh_search_tools: tool({
      description: "Fallback search over OpenHaven's tool records by keyword. Use only if the OpenHaven tools fail.",
      inputSchema: z.object({ query: z.string().min(2).max(80) }),
      execute: async ({ query }) => {
        const s = await loadSnapshot(env);
        const words = query.toLowerCase().match(/[a-z0-9]{3,}/g) ?? [];
        return s.tools
          .map((t) => ({ t, n: words.filter((w) => `${t.name} ${t.description} ${(t.searchKeywords ?? []).join(" ")}`.toLowerCase().includes(w)).length }))
          .filter((x) => x.n > 0)
          .sort((a, b) => b.n - a.n)
          .slice(0, 5)
          .map(({ t }) => ({ id: t.id, name: t.name, summary: clean(t.description).slice(0, 200), reviewed: t.lastInvestigated }));
      },
    }),
    oh_get_tool: tool({
      description: "Fallback: one OpenHaven tool record by id. Use only if the OpenHaven tools fail.",
      inputSchema: z.object({ id: z.string() }),
      execute: async ({ id }) => {
        const s = await loadSnapshot(env);
        const t = s.byId.get(id) ?? s.tools.find((x) => x.name.toLowerCase() === id.toLowerCase());
        return t ? card(t) : { error: `No tool with id ${id}` };
      },
    }),
  };
}
