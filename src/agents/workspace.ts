import { Agent, callable } from "agents";
import { z } from "zod";
import { Profile, Question } from "../shared/schema";
import { isoWeek, weekResetsAt, WEEKLY_CHAT_TURNS, WEEKLY_RUNS } from "../limits";

/** Groups, sessions and weekly caps for one browser (SPEC §7.2). Named by the workspace id. */
export type WorkspaceState = {
  groups: { id: string; name: string; short: string; answers?: unknown; profile: Profile; briefings: number }[];
  currentGroupId: string | null;
  sessions: { id: string; name: string; groupId: string; question: string; title: string | null; status: string; created: number; followOns: string[] }[];
  usage: { week: string; runsLeft: number; chatLeft: number; resetsAt: string };
};

type Refusal = { refused: "weekly_cap" | "rate" | "not_found"; resetsAt?: string };

const SCALE_SHORT: Record<string, string> = { solo: "Just me", team: "2 to 10 people", teams: "10 to 50 people", community: "50 to 500 people", network: "500+ or several groups" };
const REACH_SHORT: Record<string, string> = { members: "members only", local: "one neighbourhood", regional: "a city or region", national: "a whole country", global: "several countries", online: "online" };
function shortOf(p: Profile, briefings: number): string {
  const parts = [p.scale === "other" ? p.other?.scale : SCALE_SHORT[p.scale], p.reach === "other" ? p.other?.reach : REACH_SHORT[p.reach]].filter(Boolean);
  return `${parts.join(" · ")} · ${briefings} ${briefings === 1 ? "briefing" : "briefings"}`;
}

export class WorkspaceAgent extends Agent<Env, WorkspaceState> {
  initialState: WorkspaceState = { groups: [], currentGroupId: null, sessions: [], usage: { week: isoWeek(), runsLeft: WEEKLY_RUNS, chatLeft: WEEKLY_CHAT_TURNS, resetsAt: weekResetsAt() } };

  async onStart() {
    this.sql`CREATE TABLE IF NOT EXISTS groups (id TEXT PRIMARY KEY, name TEXT, profile_json TEXT, answers_json TEXT, created INT, updated INT)`;
    this.sql`CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, name TEXT, group_id TEXT, question TEXT, title TEXT, status TEXT, created INT, follow_ons TEXT, trial_notes TEXT)`;
    this.sql`CREATE TABLE IF NOT EXISTS usage (week TEXT PRIMARY KEY, runs INT, chat_turns INT)`;
    this.sql`CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT)`;
    this.refresh();
  }

  private usageRow() {
    const week = isoWeek();
    const row = this.sql<{ runs: number; chat_turns: number }>`SELECT runs, chat_turns FROM usage WHERE week = ${week}`[0];
    return { week, runs: row?.runs ?? 0, chatTurns: row?.chat_turns ?? 0 };
  }

  private refresh() {
    const groups = this.sql<{ id: string; name: string; profile_json: string; answers_json: string | null; n: number }>`
      SELECT g.id, g.name, g.profile_json, g.answers_json, (SELECT COUNT(*) FROM sessions s WHERE s.group_id = g.id) AS n
      FROM groups g ORDER BY g.updated DESC`.map((g) => {
      const profile = JSON.parse(g.profile_json) as Profile;
      return { id: g.id, name: g.name, profile, answers: g.answers_json ? JSON.parse(g.answers_json) : undefined, short: shortOf(profile, g.n), briefings: g.n };
    });
    const sessions = this.sql<{ id: string; name: string; group_id: string; question: string; title: string | null; status: string; created: number; follow_ons: string | null }>`
      SELECT id, name, group_id, question, title, status, created, follow_ons FROM sessions ORDER BY created DESC LIMIT 50`.map((s) => ({
      id: s.id, name: s.name, groupId: s.group_id, question: s.question, title: s.title, status: s.status, created: s.created, followOns: s.follow_ons ? JSON.parse(s.follow_ons) : [],
    }));
    const u = this.usageRow();
    const current = this.state?.currentGroupId;
    this.setState({
      groups,
      currentGroupId: current && groups.some((g) => g.id === current) ? current : groups[0]?.id ?? null,
      sessions,
      usage: { week: u.week, runsLeft: Math.max(0, WEEKLY_RUNS - u.runs), chatLeft: Math.max(0, WEEKLY_CHAT_TURNS - u.chatTurns), resetsAt: weekResetsAt() },
    });
  }

  /** Every visit pushes deletion 30 days out (SPEC §7.2 retention). */
  private async touch() {
    const days = Number(this.env.RETENTION_DAYS ?? 30);
    const prev = this.sql<{ value: string }>`SELECT value FROM meta WHERE key = 'expire'`[0]?.value;
    if (prev) await this.cancelSchedule(prev).catch(() => false);
    const s = await this.schedule(days * 86_400, "expire");
    this.sql`INSERT OR REPLACE INTO meta (key, value) VALUES ('expire', ${s.id})`;
  }

  async expire() {
    for (const { name } of this.sql<{ name: string }>`SELECT name FROM sessions`) {
      await this.env.BriefingAgent.getByName(name).destroyBriefing().catch(() => undefined);
    }
    await this.destroy();
  }

  @callable()
  async saveGroup(profileIn: unknown, answers: unknown, groupId?: string): Promise<{ groupId: string }> {
    const profile = Profile.parse(profileIn);
    const now = Date.now();
    const id = groupId && this.sql`SELECT id FROM groups WHERE id = ${groupId}`.length ? groupId : crypto.randomUUID();
    const answersJson = answers === undefined ? null : JSON.stringify(answers).slice(0, 20_000);
    this.sql`INSERT INTO groups (id, name, profile_json, answers_json, created, updated) VALUES (${id}, ${profile.name}, ${JSON.stringify(profile)}, ${answersJson}, ${now}, ${now})
      ON CONFLICT(id) DO UPDATE SET name = excluded.name, profile_json = excluded.profile_json, answers_json = excluded.answers_json, updated = excluded.updated`;
    this.setState({ ...this.state, currentGroupId: id });
    this.refresh();
    await this.touch();
    return { groupId: id };
  }

  @callable()
  async selectGroup(groupId: string) {
    if (!this.state.groups.some((g) => g.id === groupId)) return { refused: "not_found" as const };
    this.sql`UPDATE groups SET updated = ${Date.now()} WHERE id = ${groupId}`;
    this.setState({ ...this.state, currentGroupId: groupId });
    this.refresh();
    await this.touch();
    return { ok: true as const };
  }

  /** Checks the burst limit and the weekly cap, records the session, then starts its briefing. */
  @callable()
  async startSession(groupId: string, questionIn: unknown): Promise<{ name: string; runsLeft: number } | Refusal> {
    const question = Question.parse(typeof questionIn === "string" ? questionIn.trim() : questionIn);
    const g = this.sql<{ profile_json: string }>`SELECT profile_json FROM groups WHERE id = ${groupId}`[0];
    if (!g) return { refused: "not_found" };
    if (!(await this.env.RL_RUN.limit({ key: this.name })).success) return { refused: "rate" };
    const u = this.usageRow();
    if (u.runs >= WEEKLY_RUNS) return { refused: "weekly_cap", resetsAt: weekResetsAt() };
    this.sql`INSERT INTO usage (week, runs, chat_turns) VALUES (${u.week}, 1, 0) ON CONFLICT(week) DO UPDATE SET runs = runs + 1`;
    const id = crypto.randomUUID();
    const name = `${this.name}:${id}`;
    this.sql`INSERT INTO sessions (id, name, group_id, question, title, status, created) VALUES (${id}, ${name}, ${groupId}, ${question}, NULL, 'running', ${Date.now()})`;
    this.sql`UPDATE groups SET updated = ${Date.now()} WHERE id = ${groupId}`;
    await this.env.BriefingAgent.getByName(name).start(JSON.parse(g.profile_json), question);
    this.setState({ ...this.state, currentGroupId: groupId });
    this.refresh();
    await this.touch();
    return { name, runsLeft: this.state.usage.runsLeft };
  }

  /** Called over RPC by BriefingAgent.ask() before any model call. */
  async consumeChatTurn(): Promise<{ ok: boolean; remaining: number; resetsAt: string }> {
    const u = this.usageRow();
    if (u.chatTurns >= WEEKLY_CHAT_TURNS) return { ok: false, remaining: 0, resetsAt: weekResetsAt() };
    this.sql`INSERT INTO usage (week, runs, chat_turns) VALUES (${u.week}, 0, 1) ON CONFLICT(week) DO UPDATE SET chat_turns = chat_turns + 1`;
    this.refresh();
    return { ok: true, remaining: WEEKLY_CHAT_TURNS - u.chatTurns - 1, resetsAt: weekResetsAt() };
  }

  /** Called over RPC by BriefingAgent when its run ends. */
  async sessionDone(sessionId: string, status: "done" | "failed", title: string | null, followOns: string[]) {
    this.sql`UPDATE sessions SET status = ${status}, title = ${title}, follow_ons = ${JSON.stringify(followOns.slice(0, 3))} WHERE id = ${sessionId}`;
    this.refresh();
  }

  @callable()
  async recordTrial(sessionId: string, notes: unknown) {
    const n = z.string().max(2000).parse(notes);
    this.sql`UPDATE sessions SET trial_notes = ${n} WHERE id = ${sessionId}`;
    return { ok: true as const };
  }

  /** Preview-only test hook (reached through /api/m0, never from a browser): set this week's counters. */
  async setUsageForTest(runs: number, chatTurns: number) {
    this.sql`INSERT OR REPLACE INTO usage (week, runs, chat_turns) VALUES (${isoWeek()}, ${runs}, ${chatTurns})`;
    this.refresh();
    return this.state.usage;
  }

  @callable()
  async visit() {
    this.refresh();
    await this.touch();
    return { ok: true as const };
  }
}
