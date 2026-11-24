/**
 * Session bootstrap (SPEC §6): Turnstile at session start, then an HMAC-signed cookie binding the
 * browser to its workspace id. Agents are only reachable for that workspace (gate()).
 */
const COOKIE = "gw_session";
const DAYS = 7;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
// Cloudflare's documented always-pass test secret; used on previews only when no secret is set.
const TEST_SECRET = "1x0000000000000000000000000000000AA";

const isProduction = (url: URL, env: Env) => url.hostname === env.PRODUCTION_HOST;
const b64u = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

function secrets(env: Env, url: URL): { cookie: string; turnstile: string } | null {
  const e = env as Env & { COOKIE_SECRET?: string; TURNSTILE_SECRET?: string };
  if (e.COOKIE_SECRET && e.TURNSTILE_SECRET) return { cookie: e.COOKIE_SECRET, turnstile: e.TURNSTILE_SECRET };
  if (isProduction(url, env)) return null; // production never runs without real secrets
  return { cookie: e.COOKIE_SECRET ?? `preview-only:${env.AI_GATEWAY_ID}`, turnstile: e.TURNSTILE_SECRET ?? TEST_SECRET };
}

async function hmac(key: string, data: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64u(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(data)));
}

export async function signSession(key: string, workspaceId: string, now = Date.now()): Promise<string> {
  const body = b64u(new TextEncoder().encode(JSON.stringify({ w: workspaceId, exp: now + DAYS * 86_400_000 })));
  return `${body}.${await hmac(key, body)}`;
}

export async function readSession(key: string, value: string | undefined, now = Date.now()): Promise<string | null> {
  if (!value) return null;
  const [body, sig] = value.split(".");
  if (!body || !sig) return null;
  const expected = await hmac(key, body);
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  if (diff) return null;
  try {
    const { w, exp } = JSON.parse(new TextDecoder().decode(fromB64u(body))) as { w: string; exp: number };
    return exp > now && UUID.test(w) ? w : null;
  } catch {
    return null;
  }
}

const cookieOf = (req: Request) => req.headers.get("cookie")?.split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);

/** The workspace id bound to this request's cookie, or null. */
export async function sessionWorkspace(req: Request, env: Env): Promise<string | null> {
  const s = secrets(env, new URL(req.url));
  return s ? readSession(s.cookie, cookieOf(req)) : null;
}

/** POST /api/session { token, workspaceId? } → sets the cookie and returns { workspaceId }. */
export async function startSession(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const s = secrets(env, url);
  if (!s) return Response.json({ error: "Sessions are not configured on this deployment." }, { status: 503 });
  const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
  if (!(await env.RL_SESSION.limit({ key: ip })).success) return Response.json({ error: "Too many attempts. Wait a minute." }, { status: 429 });
  const body = (await req.json().catch(() => ({}))) as { token?: string; workspaceId?: string };
  if (!body.token) return Response.json({ error: "Missing verification token." }, { status: 400 });
  const form = new FormData();
  form.append("secret", s.turnstile);
  form.append("response", body.token);
  form.append("remoteip", ip);
  const v = (await (await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form })).json()) as { success: boolean; hostname?: string; action?: string };
  if (!v.success) return Response.json({ error: "Verification failed. Reload and try again." }, { status: 403 });
  if (isProduction(url, env) && (v.hostname !== env.PRODUCTION_HOST || v.action !== "start")) return Response.json({ error: "Verification failed." }, { status: 403 });
  const workspaceId = body.workspaceId && UUID.test(body.workspaceId) ? body.workspaceId : crypto.randomUUID();
  const cookie = `${COOKIE}=${await signSession(s.cookie, workspaceId)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${DAYS * 86400}`;
  return Response.json({ workspaceId }, { headers: { "set-cookie": cookie } });
}

/**
 * Agent gate (SPEC §5): workspace-agent/<id> must equal the cookie's workspace;
 * briefing-agent/<name> must start with "<workspace>:". Returns a Response to reject.
 */
export async function gate(req: Request, env: Env): Promise<Response | undefined> {
  const w = await sessionWorkspace(req, env);
  if (!w) return new Response("Session required", { status: 401 });
  const m = new URL(req.url).pathname.match(/^\/agents\/([^/]+)\/([^/]+)/);
  if (!m) return new Response("Not found", { status: 404 });
  const [, cls, rawName] = m;
  const name = decodeURIComponent(rawName!);
  if (cls === "workspace-agent" && name === w) return;
  if (cls === "briefing-agent" && name.startsWith(`${w}:`)) return;
  return new Response("Forbidden", { status: 403 });
}
