import { describe, expect, it } from "vitest";
import { gate, readSession, signSession } from "../src/session";
import { isoWeek, weekResetsAt } from "../src/limits";

const W = "8f14e45f-ceea-467a-9a3e-2d1f9f5b7c11";
const OTHER = "0b9c1d2e-3f40-4a5b-8c6d-7e8f90a1b2c3";
const env = { COOKIE_SECRET: "k", TURNSTILE_SECRET: "t", TURNSTILE_SITE_KEY: "0x4AAAAAAGQXeHxPm9HUPaLm", PRODUCTION_HOST: "groundwork.superbenefit.dev", AI_GATEWAY_ID: "g" } as unknown as Env;
const req = async (path: string, cookieFor?: string, secret = "k") =>
  new Request(`https://groundwork.superbenefit.dev${path}`, { headers: cookieFor ? { cookie: `x=1; gw_session=${await signSession(secret, cookieFor)}` } : {} });

describe("session cookie", () => {
  it("round-trips a workspace id", async () => {
    expect(await readSession("k", await signSession("k", W))).toBe(W);
  });
  it("rejects a tampered, foreign-key or expired cookie", async () => {
    const c = await signSession("k", W);
    expect(await readSession("k", c.replace(/^./, (x) => (x === "a" ? "b" : "a")))).toBeNull();
    expect(await readSession("other", c)).toBeNull();
    expect(await readSession("k", await signSession("k", W, Date.now() - 8 * 86_400_000))).toBeNull();
    expect(await readSession("k", undefined)).toBeNull();
  });
});

describe("agent gate", () => {
  it("lets a browser reach only its own workspace and briefings", async () => {
    expect(await gate(await req(`/agents/workspace-agent/${W}`, W), env)).toBeUndefined();
    expect(await gate(await req(`/agents/briefing-agent/${encodeURIComponent(`${W}:abc`)}`, W), env)).toBeUndefined();
    expect((await gate(await req(`/agents/workspace-agent/${OTHER}`, W), env))?.status).toBe(403);
    expect((await gate(await req(`/agents/briefing-agent/${encodeURIComponent(`${OTHER}:abc`)}`, W), env))?.status).toBe(403);
  });
  it("requires a valid cookie", async () => {
    expect((await gate(await req(`/agents/workspace-agent/${W}`), env))?.status).toBe(401);
    expect((await gate(await req(`/agents/workspace-agent/${W}`, W, "wrong"), env))?.status).toBe(401);
  });
  it("refuses production with a test site key", async () => {
    expect((await gate(await req(`/agents/workspace-agent/${W}`, W), { ...env, TURNSTILE_SITE_KEY: "1x00000000000000000000AA" } as Env))?.status).toBe(401);
  });
  it("refuses production without configured secrets", async () => {
    const bare = { PRODUCTION_HOST: "groundwork.superbenefit.dev", AI_GATEWAY_ID: "g" } as unknown as Env;
    expect((await gate(await req(`/agents/workspace-agent/${W}`, W), bare))?.status).toBe(401);
  });
});

describe("weekly caps", () => {
  it("counts ISO weeks in UTC and resets on Monday", () => {
    expect(isoWeek(new Date("2026-11-24T12:00:00Z"))).toBe("2026-W48");
    expect(isoWeek(new Date("2026-11-29T23:59:00Z"))).toBe("2026-W48"); // Sunday
    expect(isoWeek(new Date("2026-11-30T00:00:00Z"))).toBe("2026-W49"); // Monday
    expect(isoWeek(new Date("2027-01-01T00:00:00Z"))).toBe("2026-W53");
    expect(weekResetsAt(new Date("2026-11-24T12:00:00Z"))).toBe("2026-11-30T00:00:00.000Z");
    expect(weekResetsAt(new Date("2026-11-30T00:00:00Z"))).toBe("2026-12-07T00:00:00.000Z");
  });
});
