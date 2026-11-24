import { callable, type Connection, type WSMessage } from "agents";
import { Think, type ChatErrorClassification } from "@cloudflare/think";

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

export class BriefingAgent extends Think<Env> {
  waitForMcpConnections = { timeout: 8_000 };

  getModel() {
    return this.env.MODEL_CHAT as `@cf/${string}`;
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

  /** M0 probe: confirms the MCP connection and lists the tools it exposes. */
  @callable()
  async mcpProbe() {
    await this.mcp.waitForConnections({ timeout: 8_000 });
    const tools = Object.keys(this.mcp.getAITools());
    return { tools, count: tools.length };
  }
}
