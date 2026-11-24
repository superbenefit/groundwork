import { callable, type Connection, type FiberContext, type WSMessage } from "agents";
import { Think, type ChatErrorClassification } from "@cloudflare/think";
import { loadSnapshot } from "../openhaven/cache";
import { runPipeline, STEPS, type RunStash, type StepKey } from "../pipeline/run";
import { createAI } from "agents/models/ai-sdk";
import { z } from "zod";
import { Profile, Question, type Briefing, type Plan, type RunPhase } from "../shared/schema";
import { BANNED } from "../pipeline/style";
import { chatTools, followUpPrompt } from "./chat";

export type BriefingState = {
  phase: RunPhase | "idle";
  steps: { key: StepKey; label: string; status: "pending" | "active" | "done"; detail?: string }[];
  profile?: Profile;
  question?: string;
  plan?: Plan;
  briefing?: Briefing;
  counts?: { tools: number; options: number; setAside: number };
  error?: string;
  startedAt?: number;
  finishedAt?: number;
  /** Facts the briefing was written from; the follow-up chat answers from them. */
  chatFacts?: string;
  /** Set by the chat's highlight tool; the page scrolls to and pulses that option. */
  highlight?: { toolId: string; at: number };
  /** Run diagnostics for evals and logs: compose attempts with validator errors, model usage. */
  diagnostics?: { composeAttempts: { errors: string[] }[]; usage: { model: string; ms: number; inTokens: number; outTokens: number }[]; ms: number; topProbabilities: Record<string, number> };
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const freshSteps = (): BriefingState["steps"] => STEPS.map((s) => ({ key: s.key, label: s.label, status: "pending" as const }));

/**
 * Wire frames that would start or alter a model turn from the client. Chat
 * enters only through ask() (SPEC §7.3), so these are dropped before Think's
 * protocol handler sees them. Stream-resume frames and RPC still pass.
 */
const BLOCKED_FRAMES = new Set([
  "cf_agent_use_chat_request",
  "cf_agent_chat_clear",
  "cf_agent_tool_result",
  "cf_agent_tool_approval",
]);

export function isBlockedFrame(message: WSMessage): boolean {
  if (typeof message !== "string") return false;
  try {
    const t = (JSON.parse(message) as { type?: unknown }).type;
    return typeof t === "string" && BLOCKED_FRAMES.has(t);
  } catch {
    return false;
  }
}

function is429(err: unknown): boolean {
  const e = err as { status?: number; statusCode?: number; message?: string } | undefined;
  return e?.status === 429 || e?.statusCode === 429 || /\b429\b|rate.?limit/i.test(e?.message ?? "");
}

export class BriefingAgent extends Think<Env, BriefingState> {
  waitForMcpConnections = { timeout: 8_000 };
  initialState: BriefingState = { phase: "idle", steps: freshSteps() };

  private _model?: ReturnType<ReturnType<typeof createAI>>;
  /** DeepSeek through the groundwork gateway, reasoning off (docs/model-eval.md). */
  getModel() {
    this._model ??= createAI({ binding: this.env.AI, gateway: { id: this.env.AI_GATEWAY_ID, skipCache: true } })(this.env.MODEL_WRITE as `@cf/${string}`, {
      reasoningEffort: null,
    });
    return this._model;
  }

  getGateway(_model: string) {
    return { id: this.env.AI_GATEWAY_ID, skipCache: true };
  }

  classifyChatError(err: unknown): ChatErrorClassification | void {
    if (is429(err)) return "rate_limit";
  }

  getSystemPrompt() {
    return followUpPrompt(this.state.chatFacts, this.state.briefing?.title);
  }

  getTools() {
    return chatTools(this.env, (toolId) => this.setState({ ...this.state, highlight: { toolId, at: Date.now() } }));
  }

  /**
   * The only way a follow-up message enters the chat (SPEC §7.3). Checks length, the burst
   * limit and the weekly cap before any model call; a refusal makes no model call.
   */
  @callable()
  async ask(textIn: unknown): Promise<{ ok: true } | { refused: "not_ready" | "too_long" | "rate" | "weekly_cap"; resetsAt?: string }> {
    const parsed = z.string().trim().min(1).max(1000).safeParse(textIn);
    if (!parsed.success) return { refused: "too_long" };
    if (this.state.phase !== "done") return { refused: "not_ready" };
    const workspace = this.name.split(":")[0] ?? this.name;
    const burst = await this.env.RL_CHAT.limit({ key: workspace });
    if (!burst.success) return { refused: "rate" };
    const cap = await this.admitChatTurn(workspace);
    if (!cap.ok) return { refused: "weekly_cap", resetsAt: cap.resetsAt };
    await this.submitMessages([{ id: crypto.randomUUID(), role: "user", parts: [{ type: "text", text: parsed.data }] }]);
    return { ok: true };
  }

  /** Weekly follow-up cap, counted by the workspace (SPEC §8). Preview test runs have no workspace. */
  protected async admitChatTurn(workspace: string): Promise<{ ok: boolean; resetsAt?: string }> {
    if (!UUID.test(workspace)) return { ok: true };
    return this.env.WorkspaceAgent.getByName(workspace).consumeChatTurn();
  }

  /** Tells the workspace this session finished, with its title and suggested follow-on questions. */
  private async reportToWorkspace(status: "done" | "failed") {
    const [workspace, sessionId] = this.name.split(":");
    if (!workspace || !sessionId || !UUID.test(workspace)) return;
    const b = this.state.briefing;
    const names = new Map(b?.tools.map((t) => [t.id, t.name]) ?? []);
    const followOns: string[] = [];
    if (b) {
      followOns.push("The trial is done. What's a good next step?");
      const q = b.blocks.find((x) => x.kind === "questions");
      if (q && q.kind === "questions") {
        const specific = q.items.find((i) => i.toolIds !== "all" && i.toolIds.length === 1);
        if (specific && specific.toolIds !== "all") followOns.push(`${names.get(specific.toolIds[0]!) ?? ""}: ${specific.question[0]!.toLowerCase()}${specific.question.slice(1)}`);
      }
    }
    await this.env.WorkspaceAgent.getByName(workspace).sessionDone(sessionId, status, b?.title ?? null, followOns).catch(() => undefined);
  }

  /** Retention: the workspace deletes its sessions after 30 days without use. */
  async destroyBriefing() {
    await this.destroy();
  }

  /** Keeps one assistant answer in the briefing under "From your questions". */
  @callable()
  async addAnswer(messageId: string): Promise<{ ok: true } | { refused: string }> {
    const b = this.state.briefing;
    if (!b) return { refused: "no briefing" };
    const msgs = this.messages;
    const i = msgs.findIndex((m) => m.id === messageId && m.role === "assistant");
    if (i < 0) return { refused: "answer not found" };
    const textOf = (m: (typeof msgs)[number]) => m.parts.filter((p) => p.type === "text").map((p) => (p as { text: string }).text).join("\n").trim();
    const answer = textOf(msgs[i]!);
    const question = [...msgs.slice(0, i)].reverse().find((m) => m.role === "user");
    if (!answer || !question) return { refused: "answer not found" };
    const banned = BANNED.find(({ re }) => re.test(answer));
    if (banned) return { refused: `The answer uses ${banned.label}, which briefings don't allow.` };
    const blocks = [...b.blocks];
    let block = blocks.find((x) => x.kind === "fromQuestions");
    if (!block) blocks.push((block = { kind: "fromQuestions", items: [] }));
    if (block.kind === "fromQuestions" && !block.items.some((x) => x.answer === answer)) block.items.push({ question: textOf(question), answer, at: Date.now() });
    this.setState({ ...this.state, briefing: { ...b, blocks } });
    return { ok: true };
  }

  async onStart() {
    // Think installs its protocol wrapper before calling the subclass onStart,
    // so wrapping here runs first and can drop client-initiated turns.
    const inner = this.onMessage.bind(this);
    this.onMessage = async (connection: Connection, message: WSMessage) => {
      if (isBlockedFrame(message)) {
        connection.send(JSON.stringify({ type: "gw_refused", reason: "use_ask" }));
        return;
      }
      return inner(connection, message);
    };
    await this.addMcpServer("openhaven", this.env.OPENHAVEN_MCP, {
      id: "openhaven",
      transport: { type: "streamable-http" },
    });
  }

  /**
   * Starts the research run. Not client-callable: WorkspaceAgent.startSession() calls it over RPC after
   * the weekly cap check (preview test hooks call it directly). Idempotent.
   */
  async start(profileIn: unknown, questionIn: unknown) {
    if (this.state.phase !== "idle" && this.state.phase !== "failed") return { phase: this.state.phase };
    const profile = Profile.parse(profileIn);
    const question = Question.parse(questionIn);
    this.setState({ phase: "queued", steps: freshSteps(), profile, question, startedAt: Date.now() });
    await this.startFiber("research", (ctx) => this.research(ctx, {}), { idempotencyKey: `research:${this.state.startedAt}` });
    return { phase: this.state.phase };
  }

  /** Restarts a failed run from the last finished model step. */
  @callable()
  async retryRun() {
    if (this.state.phase !== "failed" || !this.state.profile || !this.state.question) return { phase: this.state.phase };
    const resume: RunStash = { plan: this.state.plan };
    this.setState({ ...this.state, phase: "queued", error: undefined, steps: freshSteps(), startedAt: Date.now() });
    await this.startFiber("research", (ctx) => this.research(ctx, resume), { idempotencyKey: `research:${this.state.startedAt}` });
    return { phase: this.state.phase };
  }

  private async research(_ctx: FiberContext, resume: RunStash) {
    const { profile, question } = this.state;
    if (!profile || !question) return;
    const steps = freshSteps();
    const update = (patch: Partial<BriefingState>) => this.setState({ ...this.state, ...patch });
    try {
      const snapshot = await loadSnapshot(this.env);
      const result = await runPipeline(this.env, snapshot, profile, question, {
        step: (key, status, detail) => {
          const i = steps.findIndex((s) => s.key === key);
          steps[i] = { ...steps[i]!, status, detail: detail ?? steps[i]!.detail };
          update({ phase: key, steps: [...steps] });
        },
        stash: (data) => {
          this.stash(data);
          if (data.plan) update({ plan: data.plan });
        },
      }, resume);
      const ms = Date.now() - (this.state.startedAt ?? Date.now());
      update({ phase: "done", steps: [...steps], plan: result.plan, briefing: result.briefing, counts: result.counts, chatFacts: result.facts, finishedAt: Date.now(), diagnostics: { composeAttempts: result.composeAttempts, usage: result.usage, ms, topProbabilities: result.topProbabilities } });
      await this.reportToWorkspace("done");
      console.log(JSON.stringify({ event: "briefing.done", ms: Date.now() - (this.state.startedAt ?? Date.now()), composedBy: result.briefing.composedBy, composeAttempts: result.composeAttempts, usage: result.usage, counts: result.counts }));
    } catch (e) {
      update({ phase: "failed", error: String((e as Error)?.message ?? e).slice(0, 300) });
      await this.reportToWorkspace("failed");
      console.error(JSON.stringify({ event: "briefing.failed", error: String((e as Error)?.stack ?? e) }));
    }
  }

  /** A run interrupted by eviction resumes from its stash in a new fiber. */
  async onFiberRecovered(ctx: { name: string; snapshot: unknown }) {
    if (ctx.name !== "research") return;
    const resume = (ctx.snapshot ?? {}) as RunStash;
    await this.startFiber("research", (c) => this.research(c, resume), { idempotencyKey: `research:recovered:${Date.now()}` });
    return { status: "completed" as const };
  }

  /** Run state for RPC callers (the preview test hook); the UI reads synced state instead. */
  async getRunState(): Promise<BriefingState> {
    return this.state;
  }

  /** M0 probe: confirms the MCP connection and lists the tools it exposes. */
  @callable()
  async mcpProbe() {
    await this.mcp.waitForConnections({ timeout: 8_000 });
    const tools = Object.keys(this.mcp.getAITools());
    return { tools, count: tools.length };
  }
}
