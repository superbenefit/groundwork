# Groundwork: PRD (proof of concept)

> **Design record (Nov 24, 2026).** This is the product brief the app was built from. Some details changed during the build; for how Groundwork works now, see [ARCHITECTURE.md](../ARCHITECTURE.md).

*A SuperBenefit guide that helps groups find tools that fit them, using OpenHaven's record.*

Status: draft for review · Nov 24, 2026
Mockups: https://claude.ai/artifact/6siUWLy1Hriz8YZMhF9nyN (Mobile and Desktop pages, each with a playable prototype and 17 frames)
Technical specification: [SPEC.md](SPEC.md)
Working name: **Groundwork** (alternatives in Open questions)

---

## 1. Summary

Groundwork is a public demo web app on Cloudflare. A person answers nine short questions about their group: what it does, how many people do the work, who benefits, how it decides, where it leans on three trade-offs, what would rule a tool out, who will set things up, its legal form, and one question it needs help with. A research agent turns those answers into structured queries against OpenHaven's record of 273 decentralized tools, 16 organization and governance models and 34 monetary mechanisms. It reads the matching entries and presents an AI-composed **briefing**. The briefing covers:

- where the group leans, and what that implies;
- the needs behind the question;
- the options, compared side by side, and how to choose between them;
- safeguards for the group's strongest leanings;
- questions to ask each project, and options set aside with the reason;
- what the group's legal form means for shared money;
- how to test a choice and review it.

An optional assistant on the briefing page answers follow-up questions. It sees the whole app state and can make new OpenHaven queries. The group profile is saved, so a later session asks only for the new question. A **Switch group** control moves between saved groups or starts a new one.

## 2. Why this, and why SuperBenefit

**SuperBenefit's work.** SuperBenefit is a worker self-directed nonprofit run as small, self-directed teams. Its stated focus is "technology that communities own and run". Its DAO Primitives framework rests on one idea: start a group with the smallest structure that works, and let governance grow from what the group actually needs.

**OpenHaven's record.** OpenHaven holds a carefully sourced, human-verified record of the open-tech landscape. It is built for people who already speak its language: protocols, affordances, capture risk, entity types.

**The gap.** A volunteer at a tool library, a repair café or a sports nonprofit has a real problem and no vocabulary to search with. Groundwork closes that gap without dumbing the record down. It:

- translates the group's situation into OpenHaven's vocabulary, and shows its work;
- returns the record's considerations in plain language, never verdicts;
- pairs the options with safeguards and a way to test and review a choice, rather than an install instruction;
- keeps a running profile of the group, so each visit builds on the last.

**Developmental intent.** The goal isn't to pick a tool for someone. It is to build their group's capacity to choose: understanding trade-offs, knowing what to ask a project's community, and running small experiments. Success means a group comes back after its trial with a sharper question.

## 3. Who it's for

| Person | Situation | What they need from us |
|---|---|---|
| Volunteer coordinator of a small community group | Non-technical; feels the pain of spreadsheets and group chats | Plain language, ready-made options, a first step |
| Organizer of a network of local groups | Coordinating several autonomous teams | Tools for nested coordination, organizing models, funding |
| Founder of a mission-driven venture or cooperative | Choosing a structure and its tooling at the same time | Org-model comparisons alongside tools |
| Technically capable community builder | Can build or self-host | The builders lane, stack combinations, relationship data |

**Primary demo persona** (used throughout the mockups): Riverside Tool Library. 6 volunteers, about 400 members, one neighbourhood, a registered nonprofit, decides by agreement. It wants low cost, no crypto, and members able to leave with their data.

## 4. Product principles

1. **Considerations, not verdicts.** We follow OpenHaven's own guidance:
   - never say "best" and never rank on quality;
   - every claim names the field it came from and the date the entry was last checked;
   - empty fields are gaps, not weaknesses;
   - inferences are labelled as ours.
2. **One question per screen.** Onboarding works like a phone app's sign-up: a full-screen question, tap to answer, and an automatic advance on single-choice questions. There are no forms, side panels or multi-field pages. The only chat is the optional follow-up sheet.
3. **Ask only what the search uses.** Every question feeds a specific search input (§7). Anything the search doesn't use isn't asked.
4. **Direct copy.** State the fact, in the user's terms. Titles name the topic; sentences carry the facts. No first-person "we". No slogans, no hedging preambles, no filler adjectives. The test: every sentence tells the reader something they didn't know, or asks for something we need.
5. **Options, not prescriptions.** The briefing lays out every option that fits, side by side, with the trade-offs that separate them and the questions that would settle the choice. It never names a recommended tool or a recommended set of tools, and it never presents a guess as a finding. Any combination it mentions is labelled as a possibility, not as something known to work.
6. **Written for the group.** Briefings include questions to ask the group and save as a one-page PDF.
7. **Honest about the record.** The briefing says when an entry is stale (last checked more than 6 months ago), when the record is silent, and when a question is outside the record (land, legal systems, physical infrastructure).
8. **About the user, not the data source.** On-screen copy never uses OpenHaven's terms: no affordances, entity types, capture risk or records. It uses plain words about the user's group.
   - Plain labels: "What you need", "Maturity: Early release / In use", "Takeover risk: Low / Moderate / High", "Reviewed Jul 2026", and "✓ confirmed · ✕ doesn't fit your answers · ? unknown, ask them".
   - OpenHaven appears in one place: a small "Powered by OpenHaven" badge (on the welcome, research and briefing screens, and returning visits). It links to openhaven.net and doubles as the CC BY-SA credit.
   - Internally, every fact still carries its field reference and review date. The vocabulary is translated only at render time.

## 5. Loose framing from DAO Primitives (internal only)

We use the framework's structure. We don't use its words in the UI.

| DAO Primitives idea | How Groundwork uses it | What the user sees |
|---|---|---|
| Group state as Purpose / Practice / Progress | The saved group profile has three parts: what you do (purpose), how you decide and what you rule out (practice), and past briefings with trial results (progress) | Questions 1–8; "From your last briefing" |
| Scales: collaboration (≤10), coordination, community, network | The people question | "2 to 10 / 10 to 50 / 50 to 500 / More than 500, or several groups" |
| Phases: conversation → formation → organization → iteration | Inferred from the question text by the planner, not asked | The briefing shape (compare, survey, or go deeper on one tool) |
| Pattern vs primitive (practices implemented with tools) | Every briefing pairs the options with safeguards and a test-and-review step | "Keeping it balanced", "Test it, then review" |
| Start minimal; governance grows from need | Shortlist, trial one real decision, then come back; return visits build on what the group learned | "The purchase vote is done. What's a good next step?" |
| Self-maintained state and autonomy | Each group keeps its own profile and briefings; switching groups is one tap; the profile exports as JSON | "Switch group" sheet |

## 6. Experience

Phone-first, at 390 pt wide, with a desktop layout of every screen. Both come from the same components, switched by one `desktop` prop that responds to the viewport.

| | Mobile (≤ 760 px) | Desktop |
|---|---|---|
| Onboarding | Full-screen question; Start and Find tools buttons span the width | One question in a centred 720 px column; 40 px questions; options at most 520 px wide; buttons sized to their content |
| Briefing | One column; the comparison becomes stacked cards; full-width sticky "Ask a follow-up question" bar | Overview at reading width; leanings in three columns; needs in four; comparison table; How to choose in four columns; Keeping it balanced in three; Questions next to Set aside; Legal setup next to Test it, then review; floating follow-up button |
| Follow-up questions | Bottom sheet | 460 px side panel over the dimmed briefing |
| Switch group | Bottom sheet | Centred dialog |

The mockup canvas has two pages, Mobile and Desktop. Each has a playable prototype and every frame laid out in order.

**Onboarding.** Nine questions, in three parts: the group, how it likes to work, and what it needs. Single-choice questions advance on tap. Text, multi-select and scale questions use OK.

**Free-text answers.** Every choice question ends with "Other" (on "What would rule a tool out?", it's "Something else"). Choosing it opens a text field under the options, with a placeholder example, and the question no longer auto-advances. Free-text answers go to the planner as written. The planner maps them to the nearest structured value where one exists, and otherwise keeps them as context for the briefing (frame 5b shows this state).

| # | Screen | Input | Why the search needs it |
|---|---|---|---|
| — | Welcome | Start | — |
| 1 | What does your group do? | 1–2 sentences | Context for the planner and the overview |
| 2 | How many people do the work? | 5 options + Other | Scale: decision structures, participant limits, org models |
| 3 | Who benefits from it? | 6 options + Other | Reach: `scale` on org models and funding approaches; place-based tools |
| 4 | How are decisions made today? | 6 options + Other | Org model `decisionMaking`; governance affordances |
| 5 | Where does your group lean? | Three 5-point scales, plus an optional note | The trade-offs that shape every recommendation (below) |
| 6 | What would rule a tool out? | Multi-select (6) + Something else | Hard filters; violations move to "Set aside" with the reason |
| 7 | Who will set it up? | 3 options + Other | Ready-made apps vs developer tools |
| 8 | Is your group a legal organization? | 5 options + Other | Who can hold shared money and sign agreements; org model `legalPersonhood` |
| 9 | What do you need help with? | Text, with tappable example questions | Planner → needs, domains, briefing shape |
| — | Check your answers | Name the group; edit any answer | — |
| — | Research | Five steps tick off (about 30 s) | — |

**The three trade-off scales (question 5).** Each pair trades one good thing for another, and there is no right answer:

| Scale | Left pole | Right pole | Used for |
|---|---|---|---|
| Speed vs say | Quick decisions by a few | Everyone has a say, even if slower | Weighting affordances (`consent-governance`, `slow-deliberation`, `dissent-pathways` vs role-based tools); org model `decisionMaking` |
| Stability vs adaptability | Rules that stay put | Rules that change as you learn | Whether tools let groups edit their own processes; the safeguards section |
| Automation vs judgement | Software enforces the rules | People use judgement | Whether tools that execute decisions automatically (on-chain votes, automatic payouts) are a fit or a risk |

**Progress.** A segmented bar under the header shows all nine questions:
- answered questions are filled red, the current one orange, upcoming ones light;
- above the bar, the current part ("Your group", "How you work" or "Your question") is shown on the left and "Question 4 of 9" on the right;
- the header reads "Answers saved as you go".

**Question 9 examples.** Three complete example questions from other kinds of groups, which the user can tap to start from. No topic chips.

Each question carries a one-line note on what the answer changes, for example "Tools that break these are set aside, with the reason."

**Briefing** (frame 13). A standalone document a group can share. It follows the same arc as the onboarding: trade-offs, options, safeguards, legal setup, then testing and review.

- **Title:** a plain document title naming the topic, e.g. "Tools for member voting and open spending". Above it: "Briefing for [group] · [date]". The title never answers, judges or refers back to the question.
- **Overview:** what the group wants, where it leans, how many options meet the needs, and what the briefing covers.
- **Where your group leans:** each of the three scales with the group's position, and one sentence on what that leaning implies for tool choice.
- **What the group needs:** each need, with how many ready-made options meet it.
- **The options:** listed alphabetically, never ranked.
  - Desktop shows a comparison table: needs and limits as columns, marked ✓ confirmed, ✕ doesn't fit your answers, ? unknown, plus maturity, takeover risk and review date. Mobile shows the same data as stacked cards.
  - Stale reviews are flagged.
- **How to choose:** the trade-offs that separate the options for this group.
- **Keeping it balanced:** for each strong leaning, its typical failure and a common safeguard. For example: everyone has a say → decisions stall → agree who votes, set a minimum turnout, let proposals lapse. These safeguards apply whichever tool the group picks.
- **Questions to ask before choosing:** one row per unknown, naming which tool it applies to.
- **Set aside:** options that break a limit, with the reason.
- **Your legal setup:** what the group's legal form means for shared money and binding decisions, what to check (bylaws, who holds the funds), and related ways to organize.
- **Test it, then review:** shortlist, ask the questions, trial one real decision, then look at turnout, time to decide, how objections were handled, and volunteer workload. Ends with "Come back with what you learned" and Save as PDF.
- **Footer:** the Powered by OpenHaven badge, and a sticky "Ask a follow-up question" button.

**Follow-up questions** (frame 14). A bottom sheet over the briefing:

- the title is "Ask about your briefing"; the header says "Knows your answers and this briefing. Can look up more tools.";
- lookups appear as chips ("Looked up Moss");
- answers lead with the direct answer ("No."), then the evidence and dates;
- actions: "Add to briefing" and "Show Moss in the comparison";
- suggested questions sit in a horizontal row.

**Returning** (frames 15–16). One screen: "What do you need help with now?"

- the saved answers are summarized in one line, with an Edit link;
- follow-ups are suggested from the last briefing;
- the group name at the top opens the Switch group sheet, which lists each group and has "Add a group".

**Motion.** Use 300–550 ms ease-out transitions:

- questions enter from below; Back reverses the direction;
- options stagger in by 40 ms;
- a selected option fills, then the next question follows after 320 ms;
- research steps tick off in sequence;
- briefing sections rise as they load;
- sheets slide up over a fading scrim.

Everything is disabled under `prefers-reduced-motion`.

**Brand.** Tokens are taken from feature-relaunch.superbenefit.dev:

- colours: cream `#edddc8` / `#f5ede0`, charcoal `#2d2d2d`, black `#1a1a1a`, orange `#f5872c`, red `#c4401a` / `#8f3b24`, gold `#d4a843`, green `#7a9a4e`;
- type: Playfair Display for questions and headlines, Inter for body;
- shapes: 2px rules, 12–14px radii, pill buttons;
- the four-colour gradient is the brand mark; the progress bar uses red (answered), orange (current) and light cream (upcoming).

Small text uses black or deep red on cream. Orange is for accents only, because it fails contrast on cream.

## 7. Onboarding → OpenHaven query mapping

| Question | Stored as | Used for |
|---|---|---|
| What does your group do? | `profile.purpose` | Planner context; summary wording |
| How many people do the work? | `scale: solo \| team \| teams \| community \| network` | Planner framing; `maxParticipants` where recorded; org-model relevance |
| Who benefits from it? | `reach: members \| local \| regional \| national \| global \| online` | `scale` on org models and monetary mechanisms; `place-mapping` domain when local |
| How are decisions made today? | `decision: single \| consensus \| vote \| roles \| board \| unsettled` | Org model `decisionMaking`; affordances `consent-governance`, `slow-deliberation`, `dissent-pathways` |
| What would rule a tool out? | `limits[]` | Hard filters (below) |
| Who will set it up? | `setup: none \| guided \| developer` | Lane assignment |
| What do you need help with? | `session.question` | Planner → needs, domains, briefing shape |
| Where does your group lean? | `leans: { speedSay: 1–5, stableAdapt: 1–5, autoJudge: 1–5 }`, `leanNote` | Affordance weighting; filtering automated-execution tools; the "Where your group leans" and "Keeping it balanced" sections |
| Is your group a legal organization? | `legal: informal \| nonprofit \| coop \| company \| unsure \| other` | Org model `legalPersonhood` and `capitalModel`; the "Your legal setup" section |
| Any "Other" answer | `other[field]` (free text) | Planner maps it to the nearest structured value, or keeps it as context |
| Group name (check screen) | `profile.name` | Switch-group list only |

We dropped project stage and the three-month outcome. The planner infers stage from the question, and "Test it, then review" replaces the outcome question.

**What each "rule out" option checks:**

- **Needs crypto or tokens:** tools with `entityType` `decentralized-monetary-protocol` or `smart-contract-standard`, or with token signals in `assetValueEmbedding` or `smartContract`.
- **Costs money:** `costModel`, `terms`.
- **Needs a server to run:** `deploymentModel`, `instanceServerRequirements`.
- **No phone app:** `mobileSupport`, `nativeApps`.
- **Fails on poor internet:** `offlineCapabilities`, and the affordances `offline-mesh` and `local-first-storage`.
- **Data can't be exported:** `dataPortability`, `web2DataExport`, and the affordance `data-portability`.
- **Something else:** free text; the planner turns it into a check against the nearest field, or lists it as a question to ask each project.

A tool that breaks a limit moves to **Set aside** with the reason. A missing field is never a violation: it becomes a "?" fact and a question to ask the project.

**Which options appear where:**

- **The options (comparison):** `d-app`, `ext-d-app` and `p2p-platform` entries with `devStatusCode` 8–10 that meet at least one need and break no limit. When setup is "A developer", protocols and other building blocks join the comparison.
- **Set aside:** breaks a limit, or is a developer building block when setup is "No one technical" or "Someone who can follow a guide". The reason is always shown.
- **Not ready yet:** status 1–7. These are left out of the comparison and listed in one line if relevant.

## 8. Research pipeline

The run combines model steps with code steps on purpose. Workers AI tool-calling is the least reliable part of the stack, so the research run uses the model only where judgement is needed. Retrieval is plain code over OpenHaven's static JSON API, which has no rate limit and is about 2 MB for all tools. That makes it fast, deterministic and cheap.

| Phase (UI label) | Step | Kind | Output |
|---|---|---|---|
| Understanding your question | **Plan** | 1 model call, structured output, ids constrained to OpenHaven's vocabularies | `needs[] {plain, why, affordanceId}`, `domains[]`, mapped "Other" answers, `wantsOrgModels`, `wantsMoney` |
| Weighing your priorities | **Weigh** | Code | Affordance weights from the three leanings; automated-execution tools flagged when the group leans toward judgement |
| Finding tools that match | **Retrieve + Read** | Code | Candidate tools, org models, mechanisms; full entries; staleness flags |
| Removing what you ruled out | **Assess** | Code | Per-tool cells (✓ / ✕ / ?) with `fieldRef`, set-aside reasons, open questions |
| Writing your briefing | **Compose** | 1 model call, structured output | `Briefing` JSON (§9), checked by a validator |

**Plan.** The prompt contains the profile, the question, and the affordance and domain vocabularies (ids, names and descriptions). Ids that fail validation are repaired once; then we fall back to keyword matching against affordance descriptions.

**Retrieve.** Match tools by affordance across all domains, not domain by domain. We found the record has tools whose affordances sit outside their listed domains. For example, Moss has `consent-governance` but is filed under `co-creation-knowledge`, so the Navigator's domain-first query (`find_tools_for_use_case`) misses it.

- Score each tool by how many of the group's needs it covers. The score is used for ordering only and is never shown as a quality score.
- Cap the results at about 8 tools across lanes.
- Org models: overlap on `decisionMaking`, `scale`, `capitalModel`, `membershipModel`, `legalPersonhood` and `purposeOrientation`.
- Mechanisms: `scale` plus the group's constraints, with `governanceRequirements` and `resourceRequirements` used as readiness notes.
- Optionally, `search_site` (through MCP) pulls one or two research pages, such as Peerfunding or Prosocial Use Cases, as "Read more".

**Assess.** Build considerations from templates over named fields, such as "Capture risk 3, and the reasoning says … (checked Jul 2026)". The model only rephrases them.

**Compose.** The model receives the assessed records and returns the briefing spec. The validator rejects:

- any tool id that is not in the retrieved set;
- any consideration without a `fieldRef`;
- the word "best", any ranking, and any recommendation ("use X", "we suggest", a single proposed stack);
- a title that answers or refers back to the question;
- any claim marked ✓ that has no field behind it.

A rejected spec gets one retry; after that we render a template briefing.

**Progress.** Each phase writes to the agent's synced state: `run.phase`, plus partial results such as `needs`, `counts` and `reading[]`. The research screen animates from those updates.

**Durability.** The run executes inside the session's agent, not the HTTP request: either `startFiber()` or a scheduled task. A reload reattaches to it. A later version could become a `ThinkWorkflow` with `step.prompt(..., { output: schema })`.

## 9. Briefing spec (AI-customized UI)

The model chooses which blocks to use, their order and their emphasis from a fixed vocabulary. React renders each block. The model writes copy and picks layout; it never writes markup.

```ts
type Briefing = {
  title: string;      // a document title naming the topic; never an answer or a reference to the question
  overview: string[]; // ≤ 2 paragraphs: what the group wants, where it leans, how many options fit, what is unknown
  blocks: Block[];    // fixed order (below); the model may omit a block that has nothing to say
  sources: { id: string; url: string; checked: string }[];
};
type Block =
  | { kind: 'leanings'; items: { scale: 'speedSay'|'stableAdapt'|'autoJudge'; value: 1|2|3|4|5; implication: string }[] }
  | { kind: 'needs'; items: { plain: string; affordanceId: string; count: number }[] }
  | { kind: 'comparison'; toolIds: string[]; columns: string[]; cells: { toolId: string; column: string; state: 'yes'|'conflict'|'unknown'; fieldRef?: string }[] }
  | { kind: 'howToChoose'; items: { title: string; body: string }[] }
  | { kind: 'safeguards'; items: { leaning: string; risk: string; safeguard: string }[] }
  | { kind: 'questions'; items: { toolIds: string[] | 'all'; question: string }[] }
  | { kind: 'setAside'; items: { toolId: string; reason: string }[] }
  | { kind: 'legal'; paragraphs: string[]; related: { kind: 'orgModel'|'mechanism'; id: string; note: string }[] }
  | { kind: 'testReview'; steps: string; review: string[] };   // tool-neutral
// Order: leanings, needs, comparison, howToChoose, safeguards, questions, setAside, legal, testReview.
// Per-tool data (name, kind, maturity, takeover risk, review date) is computed in code and merged at render time.
```

## 10. The assistant

- **What it is:** a `Think` agent, one instance per briefing session. It opens only when the person presses "Ask a follow-up question".
- **Context:** a `configureContext()` block holding the group profile, the session question, the briefing JSON and the assessed records. It is refreshed whenever the briefing changes.
- **Tools:**
  - OpenHaven's MCP server, via `addMcpServer('openhaven', 'https://openhaven.net/mcp')`: search, get entries, relationships, org models, mechanisms, pages. Set `waitForMcpConnections` so the tools are there after hibernation.
  - `addToBriefing(block)`: appends a "From your questions" block, which goes through the same validator.
  - `highlight(sectionId)`: a client tool that scrolls the page and pulses a card.
  - `rerunWith(changes)`: proposes a profile or question change and starts a new run after the person confirms.
- **Behaviour:** the system prompt follows the OpenHaven tool-guide method: cite fields and dates, never "best", name gaps, and label suggestions as ours. Tool calls appear as small chips. Short answers are the default.
- **Fallback:** if MCP is rate-limited, the same tools run as local functions over the cached static JSON. OpenHaven rate-limits MCP per client address, and Workers share egress addresses.

## 11. Groups and sessions

- **Identity:** an anonymous workspace id, a random UUID kept in `localStorage`. There are no accounts.
- **`WorkspaceAgent`** (a plain `Agent`, one per workspace id). Its SQLite tables:
  - `groups(id, name, profile_json, created, updated)`
  - `sessions(id, group_id, question, status, created, briefing_title, trial_notes)`
- **`BriefingAgent extends Think`** (one per session, named `${workspaceId}:${sessionId}`): run state, the briefing JSON, the chat history and trial notes.
- **New question:** copies the group profile into a new session. The person only types the question. Follow-on chips come from the last briefing's open questions and its `testReview` step.
- **Switch group:** a sheet (mobile) or dialog (desktop) listing the workspace's groups, plus "Add a group".
- **Export:** "Save as PDF" on the briefing (print stylesheet). "Download my group" (JSON) is a stretch goal.
- **Retention:** a scheduled cleanup deletes workspaces idle for 30 days. This is stated in the UI.

## 12. Architecture (Cloudflare)

Full detail, including config, routing, data model, abuse controls and deployment, is in [SPEC.md](SPEC.md).

```
Browser (Astro static pages + React islands, ClientRouter transitions)
   │  WebSocket / RPC (agents/react: useAgent, agent.stub.*, useAgentChat)
   ▼
Worker (Hono)  ── run_worker_first: /agents/*, /api/*  ── static assets for everything else
   ├─ agentsMiddleware → WorkspaceAgent (Agent, SQLite DO)
   │                   → BriefingAgent  (Think, SQLite DO) ──► Workers AI (AI binding)
   │                                                   └────► OpenHaven MCP (streamable HTTP)
   ├─ /api/oh/*  cached proxy of openhaven.net/api/*.json (KV + Cache API, refreshed daily)
   └─ Turnstile at session start, rate limits, per-browser weekly caps (public demo)
```

- **Frontend:** Astro with static output, with React islands (`client:only="react"`) for the intake, run, briefing and drawer. Motion uses CSS plus a small animation library. The brand tokens come from SuperBenefit's CSS variables.
- **Why Astro is static:** the research found no Astro guide for exporting Durable Object classes from the Cloudflare adapter's entry. Serving Astro's build as assets from a Hono Worker avoids that risk and keeps Astro's routing and transitions. If keeping Astro turns out to be painful, the fallback is Vite + React in the same Worker, the pattern every Agents SDK example uses.
- **Packages:** `agents`, `@cloudflare/think` (0.24, experimental), `ai` v7, `zod` v4, `hono`, `hono-agents`, `@modelcontextprotocol/client`.
- **Starting points to adapt:**
  - the Think getting-started tutorial;
  - the `think-submissions` example (durable runs);
  - the `web-research` example (a progress panel synced through `setState`, which is close to our run screen);
  - the `mcp-client` and `structured-input` examples.
  - The `agents-starter` template is out of date (it uses AIChatAgent and old versions), so we would borrow its UI ideas only.
- **Config:**
  - `nodejs_compat`;
  - an `ai` binding;
  - SQLite Durable Object migrations for both agent classes;
  - a KV namespace;
  - a rate-limiting binding;
  - the SuperBenefit Cloudflare account.

## 13. Models

Chosen from the M0 evals ([evals/models.md](../evals/models.md)):

| Job | Model | Variable |
|---|---|---|
| Capability picks, Plan flags, mapping "Other" answers to the closest option | `@cf/cloudflare/clef-flash` (decision model) | `MODEL_PICK` |
| Need wording, notes, Compose prose, follow-up chat | `@cf/deepseek-ai/deepseek-v4.1-flash-1017`, reasoning off | `MODEL_WRITE` |
| Fallback for both | `@cf/google/gemma-4-26b-a4b-it` | `MODEL_FALLBACK` |

- **Configuration:** model ids are Worker variables, so they can be swapped without code changes.
- **Limits:** DeepSeek V4.1 Flash is paid-only and limited to 20 requests per minute. The weekly caps and the burst limits keep the demo well under that. A 429 falls back to Gemma.
- **Cost:** about $0.18 per 1,000 Plan decisions and about $0.50 per 1,000 chat turns at list prices; Compose adds about $1–2 per 1,000 briefings. Expect $5–10 a month in total on Workers Paid (SPEC §11.4).
- **Plan requirement:** the Free Workers plan's 10 ms CPU limit is too tight for Think plus MCP, so the PoC needs Workers Paid.

## 14. Out of scope for the PoC

- Accounts, sync across devices, and shareable public links (a stretch goal is a read-only link to a briefing).
- Writing to OpenHaven or suggesting corrections. A stretch goal is a "Report a gap" link to OpenHaven's process page.
- Recommending people, consultants or vendors.
- Practices from SuperBenefit's knowledge garden as a second source. This is noted as a strong next step; see Open questions.
- Languages beyond English. OpenHaven has `es` and `pt-BR` text, so this is a cheap stretch goal.

## 15. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Free-tier model tool-calling or JSON is unreliable | Code does the retrieval; only two structured calls; validator plus one retry plus a template fallback; spike in M0 |
| MCP rate-limits shared Worker egress | Research uses the static JSON API; the assistant falls back to local tools over cached JSON |
| The record has few end-user apps for some needs (≈66 of 273 entries are apps or platforms) | Lanes make this visible; the "outside the record" callout; never stretch a protocol into an app |
| The model drifts into verdicts ("best") | Prompt rules, a validator lexicon check, and copy that frames everything as considerations |
| Public demo abuse | Turnstile at session start, rate limits, weekly caps per browser (20 briefings, 200 follow-ups), agent names bound to a signed cookie, 30-day cleanup (SPEC §8) |
| Think is experimental and its API may move | Pin versions; keep our logic in plain modules the agent class calls |
| OpenHaven data licence | Show the CC BY-SA 4.0 attribution line in the footer and the sources block |

## 16. What success looks like (demo)

- The first briefing arrives within about 4 minutes of landing, with the research run itself under 60 seconds.
- 100% of tool considerations carry a field reference and a last-checked date (enforced by the validator).
- At least 40% of briefings lead to a follow-up question, a "More about" click or a saved PDF.
- At least 25% of groups start a second session (the "come back after the trial" loop).
- Qualitative: testers can explain a trade-off for one tool in their own words.

## 17. Milestones

| | Scope | Rough size |
|---|---|---|
| M0 Spike | Hono Worker with Think agent, Workers AI candidates, MCP connected, one structured-output call; pick models | 1–2 days |
| M1 Pipeline | OpenHaven cache, Plan, Retrieve, Read, Assess, Compose, validator, state progress | 3–4 days |
| M2 Flow UI | Astro shell, brand tokens, onboarding (9 questions, Other fields, progress bar, check screen), research screen, briefing blocks, mobile and desktop | 4–5 days |
| M3 Assistant | Think chat drawer, context block, MCP tools, add/highlight tools | 2–3 days |
| M4 Groups and polish | Workspace agent, switch group, new question, Save as PDF, motion, accessibility pass | 2–3 days |
| M5 Deploy | `groundwork.superbenefit.dev` on the SuperBenefit account; Turnstile, rate limits, AI Gateway, retention timer (SPEC §11) | 1 day |

## 18. Open questions for you

1. **Name.** Groundwork, Wayfinder, Fieldguide, Toolshed? Should it carry SuperBenefit's branding, OpenHaven's, or both? (The mockups say "by SuperBenefit · powered by OpenHaven".)
2. ~~Cloudflare plan~~: confirmed on Workers Paid. Subdomain `groundwork.superbenefit.dev` and repo `superbenefit/groundwork` are approved.
3. **Knowledge garden.** Should "A way to decide" draw on SuperBenefit's knowledge garden patterns, such as Decider Protocol, Optimistic Governance and Participatory Governance, as practices, with sources? That would be the clearest expression of "tools serve practices", but it adds a second source to keep honest.
4. **Astro vs Vite + React.** Is Astro a firm preference (it matches the SuperBenefit site), or are you open to Vite if Astro and Durable Objects get in the way?
5. **Saved data.** Is browser-only storage (no accounts) right for the demo, or do you want shareable briefing links from the start?
6. **Question 1.** Keep "What does your group do?" as free text, or replace it with a pick-list of group types to make onboarding tap-only?
