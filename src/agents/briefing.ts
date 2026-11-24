import { callable, type Connection, type FiberContext, type WSMessage } from "agents";
import { Think, type ChatErrorClassification } from "@cloudflare/think";
import { loadSnapshot } from "../openhaven/cache";
import { runPipeline, STEPS, type RunStash, type StepKey } from "../pipeline/run";
import { Profile, Question, type Briefing, type Plan, type RunPhase } from "../shared/schema";

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
  /** Run diagnostics for evals and logs: compose attempts with validator errors, model usage. */
  diagnostics?: { composeAttempts: { errors: string[] }[]; usage: { model: string; ms: number; inTokens: number; outTokens: number }[]; ms: number };
};

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

  getModel() {
    return this.env.MODEL_WRITE as `@cf/${string}`;
  }

  getGateway(_model: string) {
    return { id: this.env.AI_GATEWAY_ID, skipCache: true };
  }

  classifyChatError(err: unknown): ChatErrorClassification | void {
    if (is429(err)) return "rate_limit";
  }

  getSystemPrompt() {
    return "Answer questions about this group's briefing. Address the reader as you. Never use we, our or us.";
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

  /** Starts the research run. Idempotent: a second call while running or done returns the current phase. */
  @callable()
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
      update({ phase: "done", steps: [...steps], plan: result.plan, briefing: result.briefing, counts: result.counts, finishedAt: Date.now(), diagnostics: { composeAttempts: result.composeAttempts, usage: result.usage, ms } });
      console.log(JSON.stringify({ event: "briefing.done", ms: Date.now() - (this.state.startedAt ?? Date.now()), composedBy: result.briefing.composedBy, composeAttempts: result.composeAttempts, usage: result.usage, counts: result.counts }));
    } catch (e) {
      update({ phase: "failed", error: String((e as Error)?.message ?? e).slice(0, 300) });
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
