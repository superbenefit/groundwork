# Architecture

How Groundwork works as built. For why it works this way, see the design records in [design/](design/): [PRD](design/PRD.md) (product) and [SPEC](design/SPEC.md) (original technical spec, Nov 24, 2026).

## One Worker

Everything runs in one Cloudflare Worker, `groundwork`, on the SuperBenefit account.

```
Browser ── static pages (Astro build in dist/, served as Worker assets; never reach Worker code)
   │
   ├── /api/*     Hono routes (src/server.ts)
   │                health, config, session; /api/dev/* on previews only (src/dev.ts)
   │
   └── /agents/*  hono-agents → Durable Objects, gated by the session cookie (src/session.ts)
                    WorkspaceAgent  one per browser: groups, sessions, weekly caps
                    BriefingAgent   one per briefing: research run, briefing, follow-up chat (Think)
                         │
                         ├── Workers AI through AI Gateway "groundwork"
                         ├── OpenHaven snapshot in KV (OH_CACHE), refreshed daily by cron
                         └── OpenHaven MCP server (follow-up chat lookups)
```

`wrangler.jsonc` holds every binding. `run_worker_first` sends only `/api/*` and `/agents/*` to Worker code; everything else is a static asset.

## Identity and access

1. The welcome screen is prerendered and paints before any of this. In the background the page asks `GET /api/session`; with no valid cookie it runs Turnstile (invisible unless Cloudflare wants a challenge) and posts the token to `POST /api/session`. Only starting a briefing waits for the session.
2. The Worker verifies the token, then sets `gw_session`: an HttpOnly, Secure, SameSite=Lax cookie holding `{ workspaceId, exp }` signed with HMAC-SHA-256 (`COOKIE_SECRET`). It lasts 7 days. The workspace id is also kept in `localStorage`, so the same browser keeps its groups when the cookie is renewed.
3. Every `/agents/*` request and WebSocket goes through `gate()`: the cookie must be valid, `workspace-agent/<id>` must be the cookie's workspace, and `briefing-agent/<name>` must start with `<workspace>:`. Anything else is 401 or 403.

There are no accounts. Production refuses to start sessions if `TURNSTILE_SECRET` or `COOKIE_SECRET` is missing or if the site key is a Cloudflare test key. Previews use Cloudflare's always-pass test key and test secret.

## Agents

### WorkspaceAgent (`src/agents/workspace.ts`)

A plain `Agent`, named by the workspace id. SQLite tables: `groups`, `sessions`, `usage` (per ISO week), `meta`. Synced state: the groups (with a one-line summary), the current group, recent sessions and this week's remaining allowance.

| Method | Caller | Does |
|---|---|---|
| `saveGroup(profile, answers, groupId?)` | browser | Creates or updates a group; keeps the raw answers for editing |
| `selectGroup(groupId)` | browser | Switches the current group |
| `startSession(groupId, question)` | browser | Burst limit, weekly briefing cap, then creates the session and starts its `BriefingAgent` |
| `visit()` | browser | Refreshes state and pushes the retention deadline |
| `consumeChatTurn()` | BriefingAgent | Weekly follow-up cap; called before any chat model call |
| `sessionDone(...)` | BriefingAgent | Records the briefing title and follow-on questions |
| `expire()` | schedule | 30 days after the last visit: destroys the workspace's briefings, then itself |

`recordTrial()` stores what a group learned from a trial; the UI doesn't call it yet.

### BriefingAgent (`src/agents/briefing.ts`)

A `Think` agent (`@cloudflare/think`), named `<workspace>:<session>`. Synced state: the run phase and steps, the profile and question, the plan, the briefing, the facts it was written from (`chatFacts`), the last `highlight`, and diagnostics.

| Method | Caller | Does |
|---|---|---|
| `start(profile, question)` | WorkspaceAgent | Runs the research pipeline inside a durable fiber (`startFiber`) |
| `retryRun()` | browser | Restarts a failed run from the last finished model step |
| `ask(text)` | browser | The only way into the chat: length, burst limit, weekly cap, then `submitMessages` |
| `addAnswer(messageId)` | browser | Keeps a chat answer under "From your questions" |

**Closing the chat's back door.** Think accepts chat requests straight over its WebSocket. `onStart` wraps `onMessage` and drops `cf_agent_use_chat_request`, `cf_agent_chat_clear`, `cf_agent_tool_result` and `cf_agent_tool_approval`, so `ask()` (and its cap) can't be skipped.

**Chat model and tools.** `getModel()` returns DeepSeek V4.1 Flash with reasoning off. The system prompt carries the same facts the briefing was written from. Tools: OpenHaven's MCP server (added in `onStart`), local fallbacks `oh_search_tools` and `oh_get_tool` over the snapshot, and `highlight`, which sets `state.highlight` so the page scrolls to an option (`src/agents/chat.ts`).

## Research pipeline (`src/pipeline/`)

`run.ts` runs five steps and reports each one to the agent's state, which the research screen shows live. Model steps stash their output, so a run recovered after eviction (`onFiberRecovered`) skips them.

| Step (screen label) | Module | Kind | What it does |
|---|---|---|---|
| Understanding your question | `plan.ts` | Clef-flash + DeepSeek | One decision call scores all 43 capabilities (yes/no with probabilities), answers two flags (org models, money) and maps each "Other" answer to the closest real option. Keeps 2–5 needs with p ≥ 0.5. One DeepSeek call words each need and note in plain language. |
| Weighing your priorities | `weigh.ts` | code | Leanings boost related capabilities and set flags (ask about changing rules; flag tools that act automatically). |
| Finding tools that match | `retrieve.ts` | code | Every tool with any planned capability, across all domains, scored by weighted coverage. Related org models and ways of handling money by overlap with the group's answers. |
| Removing what you ruled out | `assess.ts` | code | Checks each limit against OpenHaven's fields (table below), builds the comparison (apps first, 6 max), the set-aside list (4 max, with reasons) and the questions to ask. Widens once with the next likely needs if fewer than 2 options remain. |
| Writing your briefing | `compose.ts` | DeepSeek | Writes only prose (title, overview, implications, how to choose, safeguards, legal, test and review). Comparison cells, questions and set-aside reasons stay code-built. |

**Every ✓ and ✕ comes from code.** Each decided cell carries a `fieldRef` (`<tool>.<field>@<review date>`). A missing or ambiguous field is always "?", never ✕.

| Limit | ✓ | ✕ | ? |
|---|---|---|---|
| Crypto | "no token" in the takeover-risk reasoning | monetary or smart-contract tool; token-gated; gas fees; wallet required | any other mention of tokens, chains or wallets |
| Cost | free / open source / no paid tiers | paid or subscription only; gas fees | freemium |
| Server | no server needed; official or public instance; hosted | self-host only | otherwise |
| Phone | mobile support yes / PWA / responsive | no / not yet / in development | N/A or partial |
| Poor internet | offline or local-first capability; offline support yes | online-required | limited |
| Data export | data portability capability or field yes | no export and no portability | partial / not stated |

**Validator** (`validate.ts`). Rejects a briefing that fails the schema, changes a cell, names a tool that wasn't retrieved, has a title that asks or refers back to the question or names a tool, runs the overview past 120 words, or uses banned wording anywhere (`style.ts`: "best", "recommend", "we/our/us", "the one to try", "should use", OpenHaven vocabulary). An overview that is only too long is trimmed in code. Otherwise one retry with the errors, then the template briefing (`fallback.ts`).

## Models

| Job | Model | Variable |
|---|---|---|
| Capability picks, flags, mapping "Other" answers | `@cf/cloudflare/clef-flash` | `MODEL_PICK` |
| Need wording, notes, briefing prose, follow-up chat | `@cf/deepseek-ai/deepseek-v4.1-flash-1017`, reasoning off | `MODEL_WRITE` |
| Fallback for structured writing | `@cf/google/gemma-4-26b-a4b-it` | `MODEL_FALLBACK` |

All calls go through AI Gateway `groundwork` (`src/pipeline/ai.ts`) with a 25 s timeout and one retry. Why these models: [evals/models.md](evals/models.md).

## OpenHaven data

`src/openhaven/cache.ts` copies seven files from `https://openhaven.net/api` into KV, gzipped, with translated fields stripped, and writes the `oh:current` pointer last. The cron (`17 4 * * *`, UTC) refreshes it; a missing snapshot is fetched on demand. Each Worker instance keeps one parsed copy in memory with indexes by id and by capability. Tests use the dated copy in `fixtures/openhaven/`.

OpenHaven data is CC BY-SA 4.0. The "Powered by OpenHaven" badge and per-tool links carry the attribution; no OpenHaven vocabulary appears on screen.

## Limits

| Control | Where | Limit |
|---|---|---|
| Weekly briefings | WorkspaceAgent `usage` | 20 per browser per ISO week (UTC); resets Monday 00:00 UTC |
| Weekly follow-ups | WorkspaceAgent `usage` | 200 per browser per week |
| Burst | `ratelimits` bindings | 10 session starts / min / IP; 3 briefings / min / browser; 20 questions / min / browser |
| Input | zod | question 400 characters; chat message 1,000; free text 280–500 |
| Retention | WorkspaceAgent schedule | deleted 30 days after the last visit |

The `ratelimits` binding is approximate (per location), so the weekly caps, which live in the workspace's Durable Object, are the real limit.

## Front end (`web/`)

Astro builds static pages with React islands: `/` (`App`, `client:load`, so the welcome screen is in the HTML; the session and workspace connection start in the background, and a browser with saved groups, marked by `gw.returning` in localStorage, goes to the returning screen) and `/briefing?s=<name>` (`BriefingPage`). Islands talk to agents with `useAgent` and receive state over the WebSocket; the chat panel renders messages with Think's `useAgentChat` but sends through `ask()`.

| Component | Screen |
|---|---|
| `Onboarding.tsx` | Welcome, nine questions, check screen. Each step is a browser history entry, so Back and the phone back gesture work. |
| `Research.tsx` | Live research steps |
| `Briefing.tsx` | The briefing: table on desktop, cards on phones; print styles for Save as PDF |
| `FollowUp.tsx` | Follow-up panel: bottom sheet on phones, side panel on desktop |
| `Returning.tsx` | "What do you need help with now?", switch group, past briefings |

Brand tokens are in `web/styles/tokens.css`. Animations stop under `prefers-reduced-motion`. Security headers for static pages are in `public/_headers`.

## Repository map

```
src/
  server.ts            Hono routes, agent gate, cron handler
  dev.ts               /api/dev/* (previews only)
  session.ts           Turnstile, signed cookie, gate()
  limits.ts            ISO weeks and weekly caps
  agents/              WorkspaceAgent, BriefingAgent, chat prompt and tools
  pipeline/            plan, weigh, retrieve, assess, compose, validate, fallback, style, vocab, ai, run
  openhaven/           snapshot cache, indexes, record types
  shared/schema.ts     zod schemas shared by Worker and browser (Profile, Plan, Briefing)
web/                   Astro pages, React components, styles, browser helpers
public/_headers        security headers for static pages
test/                  vitest: pipeline (Riverside golden), validator, session/gate, answers
evals/                 model eval and end-to-end briefing scripts (run against a preview)
fixtures/openhaven/    dated OpenHaven snapshot for tests
scripts/snapshot.mjs   refreshes fixtures/openhaven
docs/                  this file, development, operations, evals, design records
```
