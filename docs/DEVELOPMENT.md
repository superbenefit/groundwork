# Development

## Setup

Node 22.12 or later (`.node-version` pins 22.23.5).

```bash
npm ci
```

`.npmrc` sets `legacy-peer-deps=true`. Some optional peers of `agents` and `@cloudflare/think` conflict under npm's default resolver, so the peers the Worker does import are listed as direct dependencies (`@cloudflare/computer`, `just-bash`). If a build fails with `Could not resolve "<package>"`, add that package as a dependency.

## Commands

| Command | Does |
|---|---|
| `npm run check` | Generates Worker types, typechecks, runs the tests. Run it before every push. |
| `npm test` | Unit tests only (vitest, Node). |
| `npm run build` | Astro build into `dist/`. `wrangler deploy` also runs it (`build.command` in `wrangler.jsonc`). |
| `npm run dev` | Builds, then `wrangler dev` on localhost. See the limits below. |
| `npm run snapshot` | Refreshes `fixtures/openhaven/` from openhaven.net. Re-run the tests afterwards: the Riverside golden test depends on the data. |
| `npm run eval:models -- <preview-url> <out-dir>` | Model comparison (picks and writing) through a preview. See [evals/models.md](evals/models.md). |
| `npm run eval:briefings -- <preview-url> <out-file>` | Runs every test persona end to end on a preview and writes a report. |

## Previews are the dev environment

Workers AI only runs remotely, so a local `wrangler dev` can serve the pages but can't run research unless you're logged in to the SuperBenefit account. The normal loop is:

1. Push a branch. Workers Builds deploys it as a Preview at `https://<branch>-groundwork.superbenefit.workers.dev`.
2. Check the build on the commit (GitHub check "Workers Builds: groundwork").
3. Test in a browser at 390 px and 1280 px wide. Look at the screens, not only the API responses.

Previews have their own Durable Objects (separate data per branch), share the production KV snapshot, use Turnstile's always-pass test key, and expose the dev routes below. Cron triggers don't run on previews; use `POST /api/dev/snapshot`.

### Dev routes (previews only)

All of these return 404 on `groundwork.superbenefit.dev` (`src/dev.ts`).

| Route | Use |
|---|---|
| `GET /api/dev/mcp` | Lists the OpenHaven MCP tools the chat agent can see |
| `POST /api/dev/run` `{ model, input }` | Calls a Workers AI model through the gateway (eval harness) |
| `GET /api/dev/snapshot`, `POST /api/dev/snapshot` | Shows or refreshes the OpenHaven snapshot |
| `POST /api/dev/brief` `{ profile, question }`, `GET /api/dev/brief/:name` | Runs a briefing without a browser session and reads its state |
| `POST /api/dev/usage/:workspace` `{ runs, chatTurns }` | Sets a workspace's weekly counters to test the caps |

## Tests

- `test/pipeline/riverside.test.ts`: the golden case from the mockups. Riverside's comparison must include Bonfire Networks, Group Income, Hypha and Moss; SpiritDAO is set aside for crypto; Valueflows is a building block; nothing in the comparison breaks a limit; every decided cell has a field reference.
- `test/pipeline/validate.test.ts`: the template briefing passes, and each kind of bad briefing is rejected for the right reason.
- `test/session.test.ts`: cookie signing and tampering, the agent gate, ISO-week boundaries.
- `test/answers.test.ts`: multi-answer questions and answers saved before they existed.

Agent behaviour (caps, chat, recovery) is tested on a preview with the dev routes and a browser.

## Rules for changes

These come from the product review and are enforced in code where possible.

**Copy**
- Address the reader as "you" and "your group". Never "we", "our" or "us".
- State things directly. Titles name the topic ("Tools for member voting and open spending"); they never answer, judge or refer back to the question.
- Present options and what is unknown. Never "best", never "recommend", never single out one option to try first. `src/pipeline/style.ts` holds the banned patterns; the validator and `addAnswer()` enforce them.
- No OpenHaven vocabulary on screen (affordance, entity type, capture risk, record, protocol). OpenHaven appears only as the "Powered by OpenHaven" badge.

**Data**
- Comparison cells, set-aside reasons and questions come from code (`assess.ts`), never from a model. A missing field is "?", never ✕.
- Models write prose only, from the facts they're given (`factSheet()` in `compose.ts`).

**UI**
- Match the approved mockups (mobile and desktop). Every choice question has "Other".
- Check new screens in a browser at both sizes, with reduced motion on, and with axe (WCAG 2.2 AA). Small text uses black or deep red on cream; orange is for accents only.

## Common changes

**Add or change an onboarding question.** Copy and options live in `web/lib/answers.ts` (`CHOICES`, `LIMIT_OPTS`, `SCALES`). The stored shape is `Profile` in `src/shared/schema.ts`; give new fields a `.default()` so saved groups still load. Plain-language labels for the model are in `src/pipeline/vocab.ts` (`OPTIONS`, `profileText()`).

**Change a limit check.** Edit `CHECKS` in `src/pipeline/assess.ts`, then run the tests: the Riverside golden test will tell you if the comparison changed.

**Change a model.** Set `MODEL_PICK`, `MODEL_WRITE` or `MODEL_FALLBACK` in both `vars` and `previews.vars` in `wrangler.jsonc`. Run `npm run eval:models` on a preview first. Reasoning switches differ by model family (`noReasoning()` in `src/pipeline/ai.ts`).

**Change Worker settings.** Previews don't inherit settings: anything in `vars` or a binding must also be in the `previews` block of `wrangler.jsonc`.

## Pull requests

Work on a branch and open a pull request against `main`. For a sequence of dependent changes, stack them: each pull request's base is the branch below it, linked with `POST /repos/superbenefit/groundwork/stacks` (or `gh stack`). Merging the top merges the stack. Merging to `main` deploys production.
