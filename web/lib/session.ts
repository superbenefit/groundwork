/**
 * Session bootstrap (SPEC §6). The server sets an HttpOnly cookie after a Turnstile check; the
 * workspace id it is bound to is kept in localStorage so the same browser keeps its groups.
 */
declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string; remove: (id: string) => void };
  }
}

const WS_KEY = "gw.workspace";
const readWs = () => { try { return localStorage.getItem(WS_KEY); } catch { return null; } };
const writeWs = (id: string) => { try { localStorage.setItem(WS_KEY, id); } catch { /* private mode */ } };

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("The verification service didn't load. Check your connection and reload."));
    document.head.appendChild(s);
  });
}

async function turnstileToken(container: HTMLElement): Promise<string> {
  const { turnstileSiteKey } = (await (await fetch("/api/config")).json()) as { turnstileSiteKey: string };
  await loadTurnstile();
  return new Promise((resolve, reject) => {
    const id = window.turnstile!.render(container, {
      sitekey: turnstileSiteKey,
      action: "start",
      appearance: "interaction-only",
      callback: (token: string) => { resolve(token); setTimeout(() => window.turnstile?.remove(id), 0); },
      "error-callback": () => reject(new Error("Verification failed. Reload and try again.")),
    });
  });
}

/** Returns the workspace id for this browser, running the Turnstile check only if the cookie is missing or expired. */
export async function ensureSession(container: HTMLElement): Promise<string> {
  const existing = await fetch("/api/session", { credentials: "same-origin" });
  if (existing.ok) {
    const { workspaceId } = (await existing.json()) as { workspaceId: string };
    writeWs(workspaceId);
    return workspaceId;
  }
  const token = await turnstileToken(container);
  const r = await fetch("/api/session", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, workspaceId: readWs() }) });
  const body = (await r.json()) as { workspaceId?: string; error?: string };
  if (!r.ok || !body.workspaceId) throw new Error(body.error ?? "Couldn't start a session.");
  writeWs(body.workspaceId);
  return body.workspaceId;
}
