# Working in this repo

Groundwork is a Cloudflare Worker (Hono + Agents SDK + Think) with a static Astro front end. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before changing behaviour and [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) before changing anything.

## Before you push

- Run `npm run check` (types and tests).
- If you touched the UI, push the branch and look at the Preview in a browser at 390 px and 1280 px. Report what you saw, not what you expect.
- If you touched the pipeline, run a briefing on the Preview (`POST /api/dev/brief`) and read the output.

## Rules that must hold

- No "we", "our" or "us" in any copy or model output. Address the reader as "you" and "your group".
- Never "best", never "recommend", never single out one option to try first. Present options, trade-offs and unknowns.
- Briefing titles name the topic. They never answer or refer back to the question.
- No OpenHaven vocabulary on screen (affordance, entity type, capture risk, record, protocol). OpenHaven appears only as the "Powered by OpenHaven" badge.
- Comparison cells, set-aside reasons and questions are built in code (`src/pipeline/assess.ts`). A missing field is "?", never ✕. Models write prose only.
- Chat messages enter only through `BriefingAgent.ask()`; keep the client chat frames blocked in `onStart`.
- Briefings start only through `WorkspaceAgent.startSession()`, which applies the weekly cap.
- Anything in `vars` or a binding in `wrangler.jsonc` must also be in the `previews` block.
- Every choice question has "Other". New `Profile` fields need a `.default()` so saved groups still load.

## Where things are

| Change | Files |
|---|---|
| Onboarding copy and options | `web/lib/answers.ts`, `web/components/Onboarding.tsx` |
| What the models see | `src/pipeline/vocab.ts` (`profileText`), `src/pipeline/compose.ts` (`factSheet`), `src/agents/chat.ts` |
| Limit checks | `src/pipeline/assess.ts` (`CHECKS`) |
| Banned wording | `src/pipeline/style.ts` |
| Models | `wrangler.jsonc` vars; `src/pipeline/ai.ts` |
| Caps, session, gate | `src/agents/workspace.ts`, `src/session.ts`, `src/limits.ts` |
| Preview-only test hooks | `src/dev.ts` |
