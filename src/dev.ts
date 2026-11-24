import { Hono } from "hono";
import { loadSnapshot, refreshSnapshot } from "./openhaven/cache";
import { Profile, Question } from "./shared/schema";

/**
 * Preview-only diagnostics and test hooks, mounted at /api/dev. Every route 404s on the production
 * host. Used by the eval and browser-test scripts in evals/ and by people debugging a preview.
 */
export const dev = new Hono<{ Bindings: Env }>();

dev.use("*", async (c, next) => {
  if (new URL(c.req.url).hostname === c.env.PRODUCTION_HOST) return c.notFound();
  await next();
});

/** OpenHaven MCP connection check: lists the tools the chat agent can see. */
dev.get("/mcp", async (c) => c.json(await c.env.BriefingAgent.getByName("dev-probe").mcpProbe()));

/** Model passthrough for evals: POST { model, input } runs env.AI.run through the gateway. */
const MODELS = /^@cf\/(cloudflare\/(clef|clef-flash|clairic)|google\/gemma-4-26b-a4b-it|qwen\/qwen3\.8-27b|deepseek-ai\/deepseek-v4\.1-flash-1017|thinkingmachines\/inkling-2-small)$/;
dev.post("/run", async (c) => {
  const { model, input } = await c.req.json<{ model: string; input: Record<string, unknown> }>();
  if (!MODELS.test(model)) return c.json({ error: "model not allowed" }, 400);
  const t = Date.now();
  try {
    const result = await c.env.AI.run(model as keyof AiModels, input as never, { gateway: { id: c.env.AI_GATEWAY_ID, skipCache: true } });
    return c.json({ ok: true, ms: Date.now() - t, result });
  } catch (e) {
    return c.json({ ok: false, ms: Date.now() - t, error: String((e as Error)?.message ?? e) });
  }
});

/** OpenHaven snapshot: GET shows counts; POST forces a refresh (previews don't run the cron). */
dev.get("/snapshot", async (c) => {
  const s = await loadSnapshot(c.env);
  return c.json({ fetchedAt: s.fetchedAt, tools: s.tools.length, affordances: s.affordances.length, orgTypes: s.orgTypes.length, mechanisms: s.mechanisms.length });
});
dev.post("/snapshot", async (c) => c.json(await refreshSnapshot(c.env)));

/**
 * Run a briefing without a browser session: POST { profile, question } → { name }; then
 * GET /api/dev/brief/:name for its state. Bypasses the workspace (no caps), so previews only.
 */
dev.post("/brief", async (c) => {
  const body = await c.req.json<{ profile: unknown; question: unknown }>();
  const name = `dev:${crypto.randomUUID()}`;
  const r = await c.env.BriefingAgent.getByName(name).start(Profile.parse(body.profile), Question.parse(body.question));
  return c.json({ name, ...r });
});
dev.get("/brief/:name", async (c) => c.json(await c.env.BriefingAgent.getByName(c.req.param("name")).getRunState()));

/** Set a workspace's weekly counters to test the caps: POST { runs, chatTurns }. */
dev.post("/usage/:workspace", async (c) => {
  const { runs, chatTurns } = await c.req.json<{ runs: number; chatTurns: number }>();
  return c.json(await c.env.WorkspaceAgent.getByName(c.req.param("workspace")).setUsageForTest(runs, chatTurns));
});
