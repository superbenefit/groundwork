import { Hono } from "hono";
import { agentsMiddleware } from "hono-agents";
import { refreshSnapshot, snapshotDate } from "./openhaven/cache";
import { dev } from "./dev";
import { gate, sessionWorkspace, startSession } from "./session";

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

// Diagnostics and test hooks for previews (src/dev.ts). Not served on the production host.
app.route("/api/dev", dev);

// Session bootstrap: Turnstile once, then a signed cookie (SPEC §6).
app.get("/api/config", (c) => c.json({ turnstileSiteKey: c.env.TURNSTILE_SITE_KEY }));
app.get("/api/session", async (c) => {
  const w = await sessionWorkspace(c.req.raw, c.env);
  return c.json({ workspaceId: w }); // null when there is no valid cookie yet
});
app.post("/api/session", (c) => startSession(c.req.raw, c.env));

// Agents: every connection and RPC must carry the cookie, and only reaches its own workspace (SPEC §5).
app.use("/agents/*", (c, next) => {
  const check = (req: Request) => gate(req, c.env);
  return agentsMiddleware<{ Bindings: Env }>({ options: { onBeforeConnect: check, onBeforeRequest: check } })(c, next);
});

export default {
  fetch: app.fetch,
  scheduled: (_event, env, ctx) => ctx.waitUntil(refreshSnapshot(env).then((p) => console.log(JSON.stringify({ event: "snapshot.refreshed", ...p })))),
} satisfies ExportedHandler<Env>;
