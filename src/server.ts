import { Hono } from "hono";
import { agentsMiddleware } from "hono-agents";
import { getAgentByName } from "agents";
import { createAI } from "agents/models/ai-sdk";
import { runPlan } from "./pipeline/plan";
import { Profile } from "./shared/schema";
import type { Affordance } from "./openhaven/types";
import { PERSONAS } from "./eval/personas";

export { WorkspaceAgent } from "./agents/workspace";
export { BriefingAgent } from "./agents/briefing";

const app = new Hono<{ Bindings: Env }>();

const isProduction = (req: Request, env: Env) => new URL(req.url).hostname === env.PRODUCTION_HOST;

app.onError((err, c) => {
  console.error(err);
  if (isProduction(c.req.raw, c.env)) return c.text("Internal Server Error", 500);
  return c.json({ error: String(err?.message ?? err), stack: err?.stack?.split("\n").slice(0, 8) }, 500);
});

app.get("/api/health", (c) => c.json({ ok: true, preview: !isProduction(c.req.raw, c.env) }));

// M0 diagnostics: never served on the production host.
app.use("/api/m0/*", async (c, next) => {
  if (isProduction(c.req.raw, c.env)) return c.notFound();
  await next();
});

app.get("/api/m0/mcp", async (c) => {
  const agent = await getAgentByName(c.env.BriefingAgent, "m0-probe");
  return c.json(await agent.mcpProbe());
});

app.get("/api/m0/personas", (c) => c.json(PERSONAS.map((p) => p.id)));

/** One Plan call: ?model=<id>&persona=<id>. The eval script loops over these. */
app.get("/api/m0/plan", async (c) => {
  const modelId = c.req.query("model") ?? c.env.MODEL_PLAN;
  if (!c.env.MODEL_CANDIDATES.split(",").includes(modelId)) return c.json({ error: "unknown model" }, 400);
  const persona = PERSONAS.find((p) => p.id === c.req.query("persona")) ?? PERSONAS[0];
  const affordances = (await (await fetch(`${c.env.OPENHAVEN_API}/affordances.json`)).json()) as Affordance[];
  const gatewayId = c.req.query("gateway") ?? c.env.AI_GATEWAY_ID; // M0 diagnostic: ?gateway=none skips the gateway
  const ai = gatewayId === "none" ? createAI({ binding: c.env.AI }) : createAI({ binding: c.env.AI, gateway: { id: gatewayId, skipCache: true } });
  try {
    const think = c.req.query("think") === "1";
    const model = think ? ai(modelId as `@cf/${string}`) : ai(modelId as `@cf/${string}`, { reasoningEffort: null, chatTemplateKwargs: { enable_thinking: false } });
    const r = await runPlan(model, Profile.parse(persona.profile), persona.question, affordances);
    return c.json({ ok: true, model: modelId, persona: persona.id, gateway: gatewayId, think, ...r });
  } catch (e) {
    return c.json({ ok: false, model: modelId, persona: persona.id, error: String((e as Error)?.message ?? e) });
  }
});

/** M0 eval passthrough: POST { model, input } runs env.AI.run through the gateway and returns the raw result. */
const RUN_ALLOWED = /^@cf\/(cloudflare\/(clef|clef-flash|clairic)|google\/gemma-4-26b-a4b-it|qwen\/qwen3\.8-27b|deepseek-ai\/deepseek-v4\.1-flash-1017|thinkingmachines\/inkling-2-small)$/;
app.post("/api/m0/run", async (c) => {
  const { model, input } = await c.req.json<{ model: string; input: Record<string, unknown> }>();
  if (!RUN_ALLOWED.test(model)) return c.json({ error: "model not allowed" }, 400);
  const t = Date.now();
  try {
    const result = await c.env.AI.run(model as keyof AiModels, input as never, { gateway: { id: c.env.AI_GATEWAY_ID, skipCache: true } });
    return c.json({ ok: true, ms: Date.now() - t, result });
  } catch (e) {
    return c.json({ ok: false, ms: Date.now() - t, error: String((e as Error)?.message ?? e) });
  }
});

app.use("/agents/*", (c, next) => {
  // M0: agents are reachable on previews only. The cookie gate (SPEC §5) lands in M1.
  const deny = (req: Request) => (isProduction(req, c.env) ? new Response("Forbidden", { status: 403 }) : undefined);
  return agentsMiddleware<{ Bindings: Env }>({ options: { onBeforeConnect: deny, onBeforeRequest: deny } })(c, next);
});

export default {
  fetch: app.fetch,
  scheduled: async () => {
    // Snapshot refresh (SPEC §9.1) lands in M1.
  },
} satisfies ExportedHandler<Env>;
