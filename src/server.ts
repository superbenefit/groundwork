import { Hono } from "hono";
import { agentsMiddleware } from "hono-agents";
import { loadSnapshot, refreshSnapshot, snapshotDate } from "./openhaven/cache";
import { Profile, Question } from "./shared/schema";

export { WorkspaceAgent } from "./agents/workspace";
export { BriefingAgent } from "./agents/briefing";

const app = new Hono<{ Bindings: Env }>();

const isProduction = (req: Request, env: Env) => new URL(req.url).hostname === env.PRODUCTION_HOST;

app.onError((err, c) => {
  console.error(err);
  if (isProduction(c.req.raw, c.env)) return c.text("Internal Server Error", 500);
  return c.json({ error: String(err?.message ?? err), stack: err?.stack?.split("\n").slice(0, 8) }, 500);
});

app.get("/api/health", async (c) => c.json({ ok: true, preview: !isProduction(c.req.raw, c.env), snapshot: await snapshotDate(c.env) }));

// ---- Preview-only diagnostics and test hooks. Never served on the production host. ----
app.use("/api/m0/*", async (c, next) => {
  if (isProduction(c.req.raw, c.env)) return c.notFound();
  await next();
});

app.get("/api/m0/mcp", async (c) => c.json(await c.env.BriefingAgent.getByName("m0-probe").mcpProbe()));

/** Eval passthrough: POST { model, input } runs env.AI.run through the gateway and returns the raw result. */
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

/** Snapshot: GET shows the current pointer and counts; POST forces a refresh. */
app.get("/api/m0/snapshot", async (c) => {
  const s = await loadSnapshot(c.env);
  return c.json({ fetchedAt: s.fetchedAt, tools: s.tools.length, affordances: s.affordances.length, orgTypes: s.orgTypes.length, mechanisms: s.mechanisms.length });
});
app.post("/api/m0/snapshot", async (c) => c.json(await refreshSnapshot(c.env)));

/** Start a briefing run in a fresh agent: POST { profile, question } → { name }. Then GET /api/m0/brief/:name for its state. */
app.post("/api/m0/brief", async (c) => {
  const body = await c.req.json<{ profile: unknown; question: unknown }>();
  const profile = Profile.parse(body.profile);
  const question = Question.parse(body.question);
  const name = `m1:${crypto.randomUUID()}`;
  const r = await c.env.BriefingAgent.getByName(name).start(profile, question);
  return c.json({ name, ...r });
});
app.get("/api/m0/brief/:name", async (c) => c.json(await c.env.BriefingAgent.getByName(c.req.param("name")).getRunState()));

app.use("/agents/*", (c, next) => {
  // Agents are reachable on previews only until the cookie gate (SPEC §5) lands with the UI.
  const deny = (req: Request) => (isProduction(req, c.env) ? new Response("Forbidden", { status: 403 }) : undefined);
  return agentsMiddleware<{ Bindings: Env }>({ options: { onBeforeConnect: deny, onBeforeRequest: deny } })(c, next);
});

export default {
  fetch: app.fetch,
  scheduled: (_event, env, ctx) => ctx.waitUntil(refreshSnapshot(env).then((p) => console.log(JSON.stringify({ event: "snapshot.refreshed", ...p })))),
} satisfies ExportedHandler<Env>;
