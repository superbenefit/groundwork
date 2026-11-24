Continue building Groundwork, a SuperBenefit proof of concept powered by OpenHaven. The design phase is finished and approved. Start implementation at milestone M0.

READ FIRST, in this order:
1. /home/user/groundwork/PRD.md: the product, the copy rules (§4), the flow (§6) and the onboarding-to-query mapping (§7).
2. /home/user/groundwork/SPEC.md: the technical spec. Follow it. Items marked VERIFY are yours to settle in M0.
3. The mockups at https://claude.ai/artifact/6siUWLy1Hriz8YZMhF9nyN. This is a Design canvas with Mobile and Desktop pages, each holding a playable prototype and 17 frames. Read it with the Artifact tool (action "read"); never use WebFetch. A local copy of the source is at /tmp/claude-0/-home-user/d3d6a35e-58e0-5e70-9165-7cdf0d72534a/scratchpad/groundwork-canvas/project/. Main.dc.html is the onboarding flow, Results.dc.html the briefing, Assistant.dc.html the follow-up panel, and NewSession.dc.html the returning-visitor screen. Each file takes a `desktop` prop. The UI must match these screens and their copy.

DECISIONS ALREADY MADE (do not reopen):
- Hosting: the SuperBenefit Cloudflare account (id c36c9a59f6251430c514f4fff55c3f4a), on the Workers Paid plan. Custom domain groundwork.superbenefit.dev. New GitHub repo superbenefit/groundwork, connected to Workers Builds.
- Stack: one Worker. Hono with hono-agents, plus a static Astro build (React islands, no Cloudflare adapter) served as Worker assets. Two agents: WorkspaceAgent (a plain Agent) and BriefingAgent (extends Think from @cloudflare/think 0.24, pinned). Workers AI through AI Gateway "groundwork". KV snapshot of OpenHaven's static JSON API, refreshed by a daily cron. Turnstile at session start, then an HMAC session cookie. Agent names are bound to the workspace id.
- Limits: weekly caps per browser of 20 briefings and 200 follow-up messages, stored in WorkspaceAgent SQLite by ISO week (UTC). The ratelimits binding is a burst guard only. Chat enters only through BriefingAgent.ask(), because Think has no admission hook.
- Models (environment variables, decided after the M0 evals in docs/model-eval.md): MODEL_PICK is @cf/cloudflare/clef-flash; MODEL_WRITE is @cf/deepseek-ai/deepseek-v4.1-flash-1017 (reasoning off); MODEL_FALLBACK is @cf/google/gemma-4-26b-a4b-it. Models retired on Nov 20, 2026 (Kimi, GLM-5.2, glm-5.3-flash and others) must not be used.
- Product rules:
  - The briefing presents options, never recommendations or "best".
  - The title is a plain document title.
  - No first-person "we", "our" or "us" in any copy.
  - No OpenHaven vocabulary on screen. OpenHaven appears only as the "Powered by OpenHaven" badge.
  - Comparison cells (✓ / ✕ / ?) come from code, not the model.
  - Every choice question has an "Other" text option.

M0 TASKS (SPEC §13), in order:
1. Ask the user to create the GitHub repo superbenefit/groundwork, or create it yourself if you have access. Attach it to the session with add_repo (access "push"), clone it, and scaffold the layout in SPEC §3. Move PRD.md, SPEC.md and HANDOVER.md into a docs/ folder there.
2. Write wrangler.jsonc exactly as in SPEC §4. Create the KV namespace groundwork-openhaven-cache in the SuperBenefit account.
3. Build a minimal BriefingAgent that connects to the OpenHaven MCP server (https://openhaven.net/mcp) and makes one structured generateText call per candidate model. Resolve each VERIFY:
   - the ai v7 Output.object / generateObject API;
   - the agents version Think requires (>= 0.34.1);
   - whether Think's WebSocket chat path can be closed to clients;
   - the compatibility_date.
4. Write the 10-persona model eval (SPEC §12), run it, record the results in docs/model-eval.md, and set MODEL_* from them.
5. Deploy a branch Preview, not production, and report back before starting M1.

WORKING RULES:
- Commit to a feature branch and push only. Open a PR only when the user asks.
- Before the first production deploy, check DNS for an existing "groundwork" record on superbenefit.dev; a custom domain cannot replace an existing CNAME.
- Ask before creating paid resources beyond those listed in SPEC §11.1.
- The user wants direct answers, no apologies and no "you're absolutely right". Keep copy and reports plain and specific.
