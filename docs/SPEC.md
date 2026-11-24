# Groundwork: technical specification (proof of concept)

Companion to [PRD.md](PRD.md). Mockups: https://claude.ai/artifact/6siUWLy1Hriz8YZMhF9nyN
Status: draft · Nov 24, 2026 · Target: `groundwork.superbenefit.dev` on the SuperBenefit Cloudflare account

Versions were checked on Nov 24, 2026. Items marked **VERIFY** were not confirmed against source and must be checked in milestone M0.

---

## 1. Scope

This document specifies a single Cloudflare Worker that serves:

1. **The web app:** a static Astro build with React islands, covering the onboarding, research screen, briefing, follow-up panel and group switching.
2. **The JSON API** under `/api/*`: session bootstrap, the OpenHaven cache and health.
3. **Two agent classes** under `/agents/*`, backed by SQLite Durable Objects:
   - `WorkspaceAgent` holds groups, sessions and usage caps;
   - `BriefingAgent` (a Think agent) holds the research run, the briefing and the follow-up chat.

It is a public demo with no accounts. Abuse is held off by Turnstile, rate limits and per-workspace caps.

## 2. Stack and versions

| Concern | Choice | Version / note |
|---|---|---|
| Runtime | Cloudflare Workers, **Workers Paid** plan | Free plan's 10 ms CPU and 50 subrequests are too tight for Think plus MCP |
| HTTP router | `hono` + `hono-agents` (`agentsMiddleware`) | hono-agents 3.0.12 |
| Agents | `agents` (Agent, `@callable`, `startFiber`, `schedule`) | 0.34.0 (Think 0.24.0's peer range is `>=0.34.0 <1.0.0`; confirmed M0) |
| Chat agent | `@cloudflare/think` | 0.24.0, labelled experimental; pin the exact version |
| AI SDK | `ai` v7, `@ai-sdk/provider` v4, `zod` v4 | `createAI` from `agents/models/ai-sdk` replaces `workers-ai-provider` |
| MCP client | `@modelcontextprotocol/client` | 2.4.0 (Think peer) |
| Frontend | Astro (static output) + `@astrojs/react` islands | Node ≥ 22.12 for the build; no `@astrojs/cloudflare` adapter |
| Client hooks | `useAgent` from `agents/react`; `useAgentChat` from `@cloudflare/think/react` | |
| Decorators | TC39 decorators via `agents/vite` plugin and `"extends": "agents/tsconfig"` | Do **not** set `experimentalDecorators` |
| Tests | Vitest + `@cloudflare/vitest-pool-workers` | |

## 3. Repository layout

New repo: `superbenefit/groundwork`.

```
groundwork/
├─ wrangler.jsonc
├─ package.json            # scripts: dev, build, deploy, test, typecheck, snapshot
├─ astro.config.mjs        # output: 'static', integrations: [react()]
├─ tsconfig.json           # extends agents/tsconfig
├─ vite.config.ts          # agents/vite plugin (for the Worker bundle)
├─ src/
│  ├─ server.ts            # Hono app + exported agent classes + scheduled() handler
│  ├─ agents/
│  │  ├─ workspace.ts      # WorkspaceAgent extends Agent
│  │  └─ briefing.ts       # BriefingAgent extends Think
│  ├─ pipeline/            # pure, unit-tested modules; no agent imports
│  │  ├─ plan.ts           # model call → Plan
│  │  ├─ weigh.ts          # leanings → affordance weights, flags
│  │  ├─ retrieve.ts       # cached JSON → candidates
│  │  ├─ assess.ts         # candidates × profile → cells, set-aside, questions
│  │  ├─ compose.ts        # model call → Briefing
│  │  ├─ validate.ts       # Briefing validator
│  │  ├─ fallback.ts       # template briefing when compose fails twice
│  │  └─ vocab.ts          # plain-language labels (takeover risk, maturity, ...)
│  ├─ openhaven/
│  │  ├─ cache.ts          # KV-backed snapshot + in-memory memo
│  │  ├─ types.ts          # Tool, Affordance, Domain, OrgType, Mechanism
│  │  └─ local-tools.ts    # MCP-equivalent tools over the snapshot (fallback)
│  ├─ session.ts           # Turnstile verify + signed cookie
│  ├─ limits.ts            # rate limit + caps helpers
│  └─ shared/schema.ts     # zod: Profile, Plan, Briefing, RunState (shared with web)
├─ web/                    # Astro project root (srcDir)
│  ├─ pages/index.astro    # welcome / returning
│  ├─ pages/start.astro    # onboarding island
│  ├─ pages/briefing.astro # briefing island (?s=<sessionId>)
│  ├─ components/          # React: Onboarding, Question*, Scale, Progress, Research,
│  │                       #        Briefing/*, FollowUp, GroupSwitcher, PoweredBy
│  └─ styles/tokens.css    # brand tokens from feature-relaunch.superbenefit.dev
├─ test/                   # vitest: pipeline units, validator, agent integration
└─ fixtures/openhaven/     # dated JSON snapshot for tests and offline dev
```

## 4. Cloudflare configuration

```jsonc
// wrangler.jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "groundwork",
  "main": "src/server.ts",
  "compatibility_date": "2026-11-17",           // confirmed in M0 (local workerd 1.20261123 and Workers Builds)
  "build": { "command": "npx astro build" },   // wrangler builds dist/ itself, so Workers Builds needs no build-command setting
  "compatibility_flags": ["nodejs_compat"],
  "workers_dev": false,
  "routes": [{ "pattern": "groundwork.superbenefit.dev", "custom_domain": true }],
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "not_found_handling": "404-page",            // multi-page static Astro build
    "run_worker_first": ["/agents/*", "/api/*"]
  },
  "ai": { "binding": "AI" },
  "durable_objects": {
    "bindings": [
      { "name": "WorkspaceAgent", "class_name": "WorkspaceAgent" },
      { "name": "BriefingAgent",  "class_name": "BriefingAgent" }
    ]
  },
  "migrations": [{ "tag": "v1", "new_sqlite_classes": ["WorkspaceAgent", "BriefingAgent"] }],
  "kv_namespaces": [{ "binding": "OH_CACHE", "id": "<create: groundwork-openhaven-cache>" }],
  "ratelimits": [
    { "name": "RL_SESSION", "namespace_id": "2101", "simple": { "limit": 10, "period": 60 } },
    { "name": "RL_RUN",     "namespace_id": "2102", "simple": { "limit": 3,  "period": 60 } },
    { "name": "RL_CHAT",    "namespace_id": "2103", "simple": { "limit": 20, "period": 60 } }
  ],
  "triggers": { "crons": ["17 4 * * *"] },        // daily OpenHaven snapshot refresh
  "vars": {
    "MODEL_PLAN": "@cf/google/gemma-4-26b-a4b-it",
    "MODEL_COMPOSE": "@cf/google/gemma-4-26b-a4b-it",
    "MODEL_CHAT": "@cf/qwen/qwen3.8-27b",
    "AI_GATEWAY_ID": "groundwork",
    "TURNSTILE_SITE_KEY": "<site key>",
    "OPENHAVEN_API": "https://openhaven.net/api",
    "OPENHAVEN_MCP": "https://openhaven.net/mcp",
    "RETENTION_DAYS": "30"
  },
  "observability": { "enabled": true },
  "previews": {
    "durable_objects": {
      "bindings": [
        { "name": "WorkspaceAgent", "class_name": "WorkspaceAgent" },
        { "name": "BriefingAgent",  "class_name": "BriefingAgent" }
      ]
    }
  }
}
```

**Secrets** (`wrangler secret put`): `TURNSTILE_SECRET`, `COOKIE_SECRET` (an HMAC key for the session cookie).

**Notes:**
- `custom_domain: true` creates the DNS record and the certificate. It fails if `groundwork` already has a CNAME in the zone (§11 pre-flight).
- Rate-limit `period` must be 10 or 60. Counts are per location and approximate, so the hard caps live in `WorkspaceAgent` (§8).
- Static asset requests are free and never reach the Worker, except for the `run_worker_first` paths.

## 5. Request routing (`src/server.ts`)

```ts
import { Hono } from "hono";
import { agentsMiddleware } from "hono-agents";
export { WorkspaceAgent } from "./agents/workspace";
export { BriefingAgent } from "./agents/briefing";

const app = new Hono<{ Bindings: Env }>();

app.post("/api/session", sessionHandler);          // Turnstile → signed cookie + workspace id
app.get("/api/health", (c) => c.json({ ok: true, snapshot: await snapshotDate(c.env) }));

app.use("/agents/*", agentsMiddleware({
  options: {
    onBeforeConnect: gate,                         // WebSocket upgrades
    onBeforeRequest: gate,                         // HTTP RPC
  },
}));

export default {
  fetch: app.fetch,
  scheduled: (_e, env, ctx) => ctx.waitUntil(refreshSnapshot(env)),
};
```

`gate(request, env)` returns a `Response` to reject, or nothing to allow:

1. Verify the `gw_session` cookie: an HMAC over `{ workspaceId, exp }`. If it is missing or invalid, return 401.
2. Parse the agent path `/agents/<kebab-class>/<name>`:
   - `workspace-agent`: `name` must equal the cookie's `workspaceId`.
   - `briefing-agent`: `name` must start with `${workspaceId}:`.
3. Return nothing to allow the request.

This makes agent names unguessable and bound to the visitor's own workspace.

## 6. Session bootstrap and identity

1. **First visit.** The client creates `workspaceId = crypto.randomUUID()`, stores it in `localStorage`, and renders the Turnstile widget (`action: "start"`) on the Welcome screen. The widget is invisible unless a challenge is needed.
2. **`POST /api/session`** with `{ token, workspaceId }`:
   1. `RL_SESSION.limit({ key: ip })`.
   2. POST to `https://challenges.cloudflare.com/turnstile/v0/siteverify` with `{ secret, response: token, remoteip }`. Require `success`, `hostname === "groundwork.superbenefit.dev"` and `action === "start"`.
   3. Set `gw_session` (HttpOnly, Secure, SameSite=Lax, Path=/, 7 days) carrying `{ workspaceId, exp }` and its HMAC.
3. **Later visits** reuse the cookie. When it expires, the client repeats step 2 silently. A Turnstile token is single-use and expires after 300 s, so the client fetches a fresh one each time.
4. **WebSockets.** Same-origin WebSocket upgrades send the cookie, so no token goes in the query string.

## 7. Data model

### 7.1 Shared schemas (`src/shared/schema.ts`, zod)

```ts
const Other = z.string().max(280);

export const Profile = z.object({
  name: z.string().min(1).max(80),
  purpose: z.string().max(500),
  scale: z.enum(["solo", "team", "teams", "community", "network", "other"]),
  reach: z.enum(["members", "local", "regional", "national", "global", "online", "other"]),
  decision: z.enum(["single", "consensus", "vote", "roles", "board", "unsettled", "other"]),
  leans: z.object({ speedSay: z.number().int().min(1).max(5),
                    stableAdapt: z.number().int().min(1).max(5),
                    autoJudge: z.number().int().min(1).max(5) }),
  leanNote: z.string().max(280).optional(),
  limits: z.array(z.enum(["crypto", "cost", "server", "mobile", "offline", "export"])),
  setup: z.enum(["none", "guided", "developer", "other"]),
  legal: z.enum(["informal", "nonprofit", "coop", "company", "unsure", "other"]),
  other: z.object({ scale: Other, reach: Other, decision: Other, limits: Other,
                    setup: Other, legal: Other }).partial().default({}),
});

export const RunPhase = z.enum(["queued", "plan", "weigh", "retrieve", "assess", "compose", "done", "failed"]);
```

`Plan`, `Briefing` and `Block` follow PRD §9 exactly. They are defined once here and imported by both the Worker and the web islands.

### 7.2 `WorkspaceAgent` (one per `workspaceId`)

**SQLite tables:**

```sql
CREATE TABLE groups   (id TEXT PRIMARY KEY, name TEXT, profile_json TEXT, created INT, updated INT);
CREATE TABLE sessions (id TEXT PRIMARY KEY, group_id TEXT, question TEXT, title TEXT,
                       status TEXT, created INT, trial_notes TEXT);
CREATE TABLE usage    (week TEXT PRIMARY KEY, runs INT, chat_turns INT);  -- week = ISO week in UTC, e.g. '2026-W48'
```

**Synced state** (`setState`): `{ groups: {id, name, short}[], currentGroupId, sessions: {id, groupId, title, created}[] }`. The returning screen and the group switcher read this.

**`@callable()` methods:**

| Method | Effect |
|---|---|
| `saveGroup(profile)` | Insert or update a group; returns `groupId` |
| `selectGroup(groupId)` | Sets `currentGroupId` |
| `startSession(groupId, question)` | Checks the weekly run cap (§8), creates a `sessions` row, calls `BriefingAgent.start()` over RPC, returns `sessionId` |
| `consumeChatTurn()` | Called over RPC by `BriefingAgent.ask()`; increments `chat_turns` for the current week and returns `{ ok, remaining, resetsAt }` |
| `recordTrial(sessionId, notes)` | Stores what the group learned; used for follow-on chips |
| `touch()` | Resets the retention timer |

**Retention:**
- On every call, `cancelSchedule(prev)` then `schedule(RETENTION_DAYS * 86400, "expire")`.
- `expire()` calls `destroy()` on each of the workspace's `BriefingAgent`s (found through the `sessions` table and reached with `getAgentByName`), then `this.destroy()`.

### 7.3 `BriefingAgent extends Think` (one per session, named `${workspaceId}:${sessionId}`)

**Synced state:**

```ts
type BriefingState = {
  phase: RunPhase;
  steps: { key: "plan"|"weigh"|"retrieve"|"assess"|"compose"; status: "pending"|"active"|"done"; detail?: string }[];
  counts?: { tools: number; options: number; setAside: number };
  profile: Profile; question: string;
  briefing?: Briefing;         // validated
  toolsView?: ToolView[];      // per-tool render data computed in code (§9.4)
  error?: string;
};
```

**`@callable()` methods:**

| Method | Effect |
|---|---|
| `start(profile, question)` | Idempotent. `startFiber("research", runPipeline, { idempotencyKey: sessionId })` |
| `addToBriefing(block)` | Validates the block, then appends it to `briefing.blocks` under a "From your questions" heading |
| `ask(text)` | The only way a follow-up message enters the chat. Validates length, calls `RL_CHAT.limit()`, asks the `WorkspaceAgent` for `consumeChatTurn()`, then submits the message with `submitMessages([...], { idempotencyKey })`. If refused, returns `{ refused: "weekly_cap" \| "rate", resetsAt }` and no model call is made |
| `retry()` | Restarts a failed run |

**Think configuration:**

```ts
export class BriefingAgent extends Think<Env, BriefingState> {
  waitForMcpConnections = { timeout: 8_000 };
  getModel() { return this.env.MODEL_CHAT; }
  getGateway() { return { id: this.env.AI_GATEWAY_ID, skipCache: true }; } // confirmed in think/src/model.ts; must be synchronous
  classifyChatError(err) { return is429(err) ? "rate_limit" : undefined; }   // Think then retries with backoff (1 s doubling to 30 s)
  getSystemPrompt() { return FOLLOW_UP_PROMPT; }                         // §10.2
  configureContext() {
    return [
      { label: "group",    provider: { get: async () => renderProfile(this.state.profile) } },
      { label: "briefing", provider: { get: async () => renderBriefingForModel(this.state) } },
    ];
  }
  getTools() { return { addToBriefing: addToBriefingTool(this), ...localOpenHavenTools(this.env) }; }
  async onStart() {
    await this.addMcpServer("openhaven", this.env.OPENHAVEN_MCP,
      { id: "openhaven", transport: { type: "streamable-http" } });
  }
}
```

- **Chat admission.** Think 0.24 has no hook to refuse a user message: `beforeTurn` can reshape a turn but not cancel it. So the client never uses `useAgentChat`'s `sendMessage` to start a turn. It calls `agent.stub.ask(text)`. It still uses `useAgentChat` to render `messages` and the stream.
  - **Closed (confirmed in M0).** Think installs its protocol wrapper on `this.onMessage` before calling the subclass `onStart`. `BriefingAgent.onStart` wraps it once more and drops `cf_agent_use_chat_request`, `cf_agent_chat_clear`, `cf_agent_tool_result` and `cf_agent_tool_approval`, replying `{ type: "gw_refused" }`. Stream-resume frames and RPC pass. Tested over a local WebSocket: the chat frame is refused, no message is persisted, RPC still answers.
  - Because client tool results are blocked, `highlight(sectionId)` is a server tool that sets `state.highlight`; the client reacts to state.
- **Fallback tools.** `localOpenHavenTools` registers the same tools under an `oh_` prefix, implemented over the KV snapshot. The prompt says to prefer MCP tools and use `oh_` ones only if MCP errors.
- **Highlight.** `highlight(sectionId)` is a server tool that writes `state.highlight = { sectionId, at }`. The client scrolls to the card and pulses it.

## 8. Abuse controls and budgets

| Control | Where | Limit |
|---|---|---|
| Turnstile | `POST /api/session` | Every new or expired session |
| `RL_SESSION` | `/api/session`, key: IP | 10 per minute |
| `RL_RUN` | `WorkspaceAgent.startSession`, key: workspaceId | 3 per minute |
| `RL_CHAT` | `BriefingAgent.ask`, key: workspaceId | 20 per minute |
| **Weekly caps** (authoritative) | `WorkspaceAgent.usage`, keyed by ISO week in UTC | **20 briefings and 200 follow-up messages per browser per week**; resets Monday 00:00 UTC |
| Model 429s | `BriefingAgent.classifyChatError` | Returns `"rate_limit"`; Think retries with backoff (1 s doubling to 30 s, then a terminal message) |
| Input caps | zod | Text fields ≤ 500 characters, question ≤ 400, chat message ≤ 1,000 |
| AI Gateway | Dashboard, gateway `groundwork` | Gateway-wide rate limit; caching on for Plan |
| Agent gating | `gate()` (§5) | Workspace-bound agent names |

When a cap is hit, the UI says so in plain words, for example "This demo allows 20 briefings a week per browser. More are available from Monday." The returning screen shows the number left this week once it drops below 5.

**How the limits work** (checked Nov 24, 2026):
- The `ratelimits` binding (GA syntax; `period` is 10 or 60 seconds) counts per Cloudflare location and is approximate and eventually consistent. It is a short-term burst guard only.
- The weekly caps are authoritative because they live in one Durable Object per workspace, which is single-threaded and strongly consistent.
- A new `workspaceId` gets a fresh cap, and Turnstile at session start is what makes minting new ones costly.
- Workers AI allows 300 requests per minute for these models across the account. The AI Gateway rate limit (60 per minute) and a spend alert sit in front as the global ceiling.

## 9. Research pipeline

`runPipeline(ctx)` runs inside the fiber. Each step updates `steps[i]` through `setState`; the research screen renders exactly these steps. Each step's output goes to `ctx.stash()` so that a recovered fiber resumes after the last finished step.

### 9.1 OpenHaven snapshot (`openhaven/cache.ts`)

- **Sources:**
  - `/api/protocols.json` (about 2 MB, 273 tools)
  - `/api/affordances.json`
  - `/api/domains.json`
  - `/api/entity-types.json`
  - `/api/organization-types.json`
  - `/api/monetary-architecture.json`
  - `/api/tool-relationships.json`
- **Storage:** gzip each file into KV as `oh:<name>:<fetchedAt>`, and write the `oh:current` pointer last. Values stay under 25 MiB.
- **Refresh:** the daily cron, plus on demand if `oh:current` is missing.
- **In-agent memo:** load once per agent instance and keep in memory. Build indexes `byAffordance`, `byId` and `byEntityType`.
- **Attribution:** every rendered source shows "Data from OpenHaven (openhaven.net), licensed CC BY-SA 4.0" through the Powered by badge, plus per-tool links.

### 9.2 Steps

| Step (UI label) | Module | Kind | Contract |
|---|---|---|---|
| Understanding your question | `plan.ts` | 1 model call | Profile + question + vocabularies → `Plan` |
| Weighing your priorities | `weigh.ts` | Code | `leans` → `affordanceWeights`, `flags` |
| Finding tools that match | `retrieve.ts` | Code | Plan + weights + snapshot → candidates (tools, org types, mechanisms) |
| Removing what you ruled out | `assess.ts` | Code | Candidates × profile → `ToolView[]`, cells, set-aside, questions |
| Writing your briefing | `compose.ts` + `validate.ts` | 1 model call, up to 1 retry | Assessed data → `Briefing` |

**Plan**
- **Call:** `generateText({ model: ai(MODEL_PLAN), output: Output.object({ schema: PlanSchema }), prompt })`, non-streaming because Workers AI rejects JSON Schema when streaming. Confirmed in M0: ai 7.0.181 deprecates `generateObject`; use `generateText({ output: Output.object({ schema }) })` and read `result.output`.
- **Prompt input:** a compact affordance list (id, name, description, domain), the domain list, the profile with every `other.*` text, and the question.
- **Output:** 2–5 `needs` (plain wording plus `affordanceId`), mappings for any "Other" answers (`{ field, mappedTo?, note }`), `wantsOrgModels`, `wantsMoney`.
- **Repair:** drop any `affordanceId` not in the vocabulary and retry once. Then fall back to keyword overlap between the question and affordance descriptions.

**Weigh** (table-driven):

| Leaning | Effect |
|---|---|
| `speedSay ≥ 4` | Boosts `consent-governance`, `slow-deliberation`, `dissent-pathways` |
| `speedSay ≤ 2` | Boosts role-based and `composable-groups` |
| `stableAdapt ≥ 4` | Adds the check "can the group edit its own processes" as a question per tool |
| `autoJudge ≥ 4` | Flags tools with `smartContract` set or `entityType` `smart-contract-standard` as "acts automatically" (a ✕ under judgement) |
| `autoJudge ≤ 2` | Treats that flag as a ✓ |

Weights affect ordering inside the comparison only. Output is always alphabetical; weights decide which tools make the cap of 6.

**Retrieve**
- **Tools:** every tool with any planned affordance, across all domains.
- **Score:** Σ weight(affordance). The score selects the top 6 and is never shown.
- **Org types:** overlap on `decisionMaking`, `scale`, `legalPersonhood`, `capitalModel`, `purposeOrientation`. Keep the top 2.
- **Mechanisms:** match on `scale` and the group's limits (for example, exclude token-based mechanisms when crypto is ruled out). Keep the top 2.

**Assess**
- **Columns:** the needs, then the group's limits (as "No crypto", "No install" and so on).
- **Cells:** each is `yes`, `conflict` or `unknown`, with a `fieldRef` when known.
  - A missing field is always `unknown`, never `conflict`.
  - `fieldRef` format: `<toolId>.<path>@<lastInvestigated>`.
- **Set aside:** any `conflict` on a limit column, plus developer building blocks when setup is `none` or `guided`. The reason is generated from a template.
- **Questions:** every `unknown` on a limit column becomes a question. Identical questions are merged across tools into an "All N" row.
- **`ToolView`:** `{ id, name, kindPlain, maturityPlain, takeoverRiskPlain, reviewed, stale, url }`.
  - `stale` means `lastInvestigated` is more than 183 days old.
  - Plain labels come from `vocab.ts`: development status code to "Early release" or "In use"; capture risk to Low, Moderate or High.

**Compose**
- **Prompt input:** the profile, the plan, `ToolView[]`, the cells, the set-aside list, the questions, org types and mechanisms, and the style rules (§10.1).
- **Output:** a `Briefing` with fixed block order. The model writes the title, the overview, leaning implications, "How to choose", safeguards, the legal paragraphs and the test/review text.
- **Cell states** are copied from Assess, never generated. The validator enforces this.

### 9.3 Validator (`validate.ts`)

`Briefing` is rejected if any of these is true:

- It fails the zod schema.
- It contains a `toolId` outside the retrieved set.
- A comparison cell differs from the Assess output.
- Any text matches the banned list (case-insensitive):
  - `\bbest\b`, `\brecommend`, `\bwe\b`, `\bour\b`, `\bus\b`;
  - `you should use`, `the right tool`, `perfect for`.
- The title:
  - ends in "?";
  - contains "your question", "this question" or "this";
  - is longer than 80 characters;
  - contains a tool name.
- The overview is more than 2 paragraphs or more than 120 words.
- A block is out of order.

**On reject:** retry once with the validator errors appended to the prompt. Then use `fallback.ts`, which renders every block from templates and Assess data and leaves out model-written prose. The UI renders it the same way.

### 9.4 Timing budget

The target for the whole run is under 45 s at p50.

| Step | Target |
|---|---|
| Snapshot load (memoized) | < 300 ms |
| Plan | ≈ 5–10 s |
| Retrieve + Assess | < 200 ms |
| Compose | ≈ 10–20 s |

CPU time is low; wall time is mostly model latency, and Durable Object requests have no wall-time limit.

## 10. Prompts (outline)

### 10.1 Style rules (shared by Compose and the follow-up chat)

- Address the reader as "you" and "your group". Never use "we", "our" or "us".
- Plain words only: no "affordance", "entity type", "capture risk", "record" or "protocol". Use "takeover risk", "maturity" and "reviewed".
- State facts directly. One idea per sentence. No preambles, no hedging adjectives.
- Never recommend, rank or call anything best. Present options and trade-offs.
- Label a suggestion as a suggestion. Never present a combination as known to work.
- Titles name the topic as a noun phrase.

### 10.2 Follow-up chat system prompt

- Role: answer questions about this group's briefing.
- Context: the group and briefing context blocks.
- Method:
  1. Answer in the first word or sentence ("No.", "Yes, with one condition.").
  2. Give the evidence with the review date.
  3. Say what is unknown.
- Tools: OpenHaven MCP tools for lookups; `addToBriefing` only when the person asks; `highlight` to point at a card.
- Length: at most 120 words unless asked for more.

## 11. Deployment to superbenefit.dev

### 11.1 Pre-flight (one time)

1. **Plan:** the SuperBenefit account (`c36c9a59…`) is on Workers Paid (confirmed by the owner).
2. **Zone:** confirm `superbenefit.dev` is a zone in the same account. Today `feature-relaunch.superbenefit.dev` and `knowledge.superbenefit.dev` resolve, and `groundwork.superbenefit.dev` returns 404. Check DNS for an existing `groundwork` record; delete it if present, because a custom domain cannot replace an existing CNAME.
3. **Existing resources:** the account already has 8 Workers, including `sb-website`, `sb-auth`, `knowledge-server` and `governance-server`, plus 10 KV namespaces. Name everything `groundwork-*` to avoid collisions.
4. **KV:** `npx wrangler kv namespace create groundwork-openhaven-cache`, then put the id in `wrangler.jsonc`.
5. **AI Gateway:** create gateway `groundwork` and set:
   - caching on, TTL 1 h (Plan only; the code passes `skipCache` for Compose and chat);
   - rate limit 60 requests per minute;
   - a spend alert.
6. **Turnstile:**
   - create a widget for `groundwork.superbenefit.dev` in Managed mode;
   - put the site key in `vars` and the secret through `wrangler secret put TURNSTILE_SECRET`;
   - set `COOKIE_SECRET` the same way.
7. **Repo:** create `superbenefit/groundwork` and connect **Workers Builds** to it:
   - production branch `main`;
   - build `npm ci && npm run build`;
   - deploy `npx wrangler deploy`;
   - preview `npx wrangler preview`;
   - Preview custom domain: `groundwork.superbenefit.dev`, so branch Previews are `<branch>.groundwork.superbenefit.dev`.

### 11.2 Environments

| | Where | Data |
|---|---|---|
| Local | `npm run dev` (`astro build --watch` + `wrangler dev`) | Local DO and KV; `fixtures/openhaven` snapshot |
| Preview | Workers Builds per branch | Its own DO namespaces through the `previews` block; shared KV, which is read-mostly and fine; Turnstile test keys |
| Production | `groundwork.superbenefit.dev` | Production DOs and KV |

Version preview URLs are not generated for Workers with Durable Objects. Use branch Previews instead.

### 11.3 Release checklist

- [ ] `npm run typecheck && npm test` pass in CI.
- [ ] The snapshot cron ran, `oh:current` is set, and `/api/health` shows today's snapshot date.
- [ ] Turnstile, the rate limits and the weekly caps all fire, and a capped `ask()` makes no model call. Check by hand on the preview.
- [ ] Ten persona eval runs (§12) pass the validator with no fallback.
- [ ] Lighthouse accessibility score ≥ 95 on Welcome, a question and the briefing, on mobile and desktop.
- [ ] Reduced-motion mode checked.
- [ ] Observability logs show no 1101 errors or uncaught exceptions on preview.
- [ ] Merge to `main`. Workers Builds deploys, and the custom domain issues its certificate on the first deploy.

### 11.4 Cost estimate (Paid)

- Base plan: $5/month.
- Workers AI: about $2–3 per 1,000 briefings with Gemma 4 for Plan and Compose and Qwen 3.8 for chat, after the 10k free Neurons a day.
- Durable Objects, KV and AI Gateway stay inside the included usage at demo traffic.
- Expected total: $5–10/month.

## 12. Testing

- **Unit tests** (`test/pipeline/*`): `weigh`, `retrieve`, `assess` and `validate` against the fixtures snapshot. Golden files for the Riverside persona must match the mockup's comparison table:
  - Bonfire, Group Income, Hypha and Moss in the comparison;
  - SpiritDAO and Valueflows set aside.
- **Validator tests:** a corpus of bad briefings, each rejected for the expected reason: "best", "we", a title ending in "?", a tool id that wasn't retrieved, a cell that differs from Assess.
- **Agent integration** (`@cloudflare/vitest-pool-workers`):
  - `startSession` leads to the phases in order, then `done`, with the model stubbed;
  - fiber recovery after a forced eviction;
  - `gate()` rejects a name from another workspace;
  - the weekly caps hold and reset on the ISO-week boundary;
  - `ask()` over cap returns `refused` and makes no model call.
- **Model evals** (`npm run eval`, not in CI): 10 personas covering different sizes, reach, leanings, legal forms and "Other" answers. Run Plan and Compose on each candidate model and record validator pass rate, latency and tokens. This decides `MODEL_*` in M0.
- **Manual:** the mockup flows end to end on iOS Safari, Android Chrome and desktop Chrome/Firefox.

## 13. Milestones (refines PRD §17)

| | Exit criteria |
|---|---|
| **M0 Spike** (1–2 days) | Worker deployed to a preview: BriefingAgent connected to OpenHaven MCP; one `generateText` structured call on each candidate model; the **VERIFY** items resolved; models chosen from the evals |
| **M1 Pipeline** (3–4 days) | Snapshot cron, all five steps, validator, fallback; golden test for Riverside passes |
| **M2 Flow UI** (4–5 days) | Astro islands match the mockups (mobile and desktop): 9 questions with Other fields, progress bar, check screen, research screen, briefing blocks, Powered by badge |
| **M3 Follow-up** (2–3 days) | Think chat panel, context blocks, MCP and fallback tools, `addToBriefing`, `highlight` |
| **M4 Groups and polish** (2–3 days) | WorkspaceAgent, switch group, returning flow with follow-on chips, Save as PDF, motion and reduced motion, accessibility pass |
| **M5 Deploy** (1 day) | §11 pre-flight done; production on `groundwork.superbenefit.dev`; release checklist complete |

## 14. Open technical questions

1. ~~Plan~~: confirmed. The account is on Workers Paid.
2. ~~ai v7 structured output~~: `generateText` + `Output.object` (§9.2).
3. ~~Think chat admission~~: closed in `onStart` (§7.3).
4. **Shared auth:** whether to reuse `sb-auth` later for named accounts; it is out of scope for the PoC.
