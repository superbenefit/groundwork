# How the models were chosen

Round 2 (Nov 24, 2026) replaces the round 1 decision below. Full tables and every sample answer: [models-round2.md](models-round2.md); raw results: [models-round2.json](models-round2.json). Harness: `evals/models.mjs` (`npm run eval:models`), gold labels: `evals/gold.mjs`.

## Round 2: picks and writing

Run against the `m0-spike` Preview through the `groundwork` gateway, with requests paced 1.5 s apart (an unpaced first attempt hit the gateway's rate limit and was discarded). Reasoning off for every model unless marked "low". Prices are list prices from developers.cloudflare.com on Nov 24, 2026.

### Picks: which capabilities a question needs

Same 10 personas. Each pick set is scored against hand-labelled gold sets: **core needs found** (recall of the 1–2 capabilities the question can't be answered without) and **precision** (share of picks that are core or reasonable). The gold labels are a judgement call and are worth a second look.

| Model | How it was asked | Core needs found | Precision | p50 / max latency | Cost per 1,000 runs |
|---|---|---|---|---|---|
| **Clef-flash** | 43 yes/no questions, keep p ≥ 0.5, top 5 | **95%** | **100%** | **0.3 s / 0.9 s** | $0.18 |
| Clef | same | 95% | 94% | 0.6 s / 1.0 s | $1.12 |
| Gemma 4 | JSON schema, ids as enum | 95% | 92% | 1.5 s / 21.2 s | $0.12 |
| Qwen 3.8 | same | 90% | 88% | 1.8 s / 7.6 s | $0.62 |
| Clairic | 43 boolean fields | 90% | 84% | 2.3 s / 16.3 s | $3.42 ($1.42 at the promo price) |

- Clef-flash had no off-target picks and the tightest latency. It returns a probability per capability, so ranking and the "how sure" signal come from the model rather than from prompt-following.
- Gemma matches it on recall but adds unrelated picks (for example `self-hostable` and `local-first-storage` for a voting question) and had one 21 s call.
- Clairic is built for reading values out of text, not choosing among options; it is the slowest and most expensive here and the least precise.
- Clef costs more than Gemma because 43 questions cost about 4.7k input tokens. At $0.18 per 1,000 runs that doesn't matter.

### Writing: search queries, notes and chat answers

Three tasks per model:
- **Search queries:** 3 queries per persona, run against a local keyword index of the 273 tools. Score: the share of top-10 hits that carry a relevant capability.
- **Notes:** one note per "Other" answer, at most 25 words.
- **Chat:** 6 follow-up questions over a briefing context built from the real records for Bonfire, Group Income, Hypha and Moss. Two are traps: "Which tool is best for us?", and a question the facts can't answer.

DeepSeek V4.1 Flash and Inkling 2 Small were the candidates; Gemma and Qwen ran as baselines.

| Model | Query hit rate | Note length (words) | Chat length (mean, range) | Chat p50 | Chat output tokens | Cost per 1,000 chat turns |
|---|---|---|---|---|---|---|
| **DeepSeek V4.1 Flash** | **60%** | 17–27 | **64** (36–99) | **2.3 s** | 102 | $0.50 |
| Inkling 2 Small | 54% | 24–25 | 103 (93–120) | 2.4 s | 521 | $0.94 |
| Gemma 4 | 53% | 19–24 | 76 (51–120) | 2.9 s | 119 | $0.17 |
| Qwen 3.8 | 49% | 19–26 | 57 (37–123) | 5.2 s | 84 | $0.84 |

Rule checks, after removing false positives ("US non-profit" matched the ban on "us"; Holochain and Cardano are in the context, so they are not invented tools):
- **Every model** used the word "best" when declining to rank ("No single tool is best"). That fails the validator. The prompt needs an explicit "don't use the word best, even to deny it" line, plus a post-filter.
- No model used "we", "our" or "us", and none named a tool outside the context.

Reading the answers:
- **DeepSeek:** answers first ("Yes, with one condition…", "Moderate (3/5)."), cites review dates, names what's unknown, and stays short. One overreach: it answered "Is Group Income free?" with "Yes" on the strength of the licence, then caveated hosting cost. Its notes are the most useful ("…weigh that against takeover risk if that volunteer leaves"), but two of four ran 1–2 words over 25. Its queries retrieved the most relevant tools.
- **Inkling:** the most careful about what's unknown; it correctly said Group Income's price isn't stated. But it runs long (always 93–120 words against a 120 cap) and its notes read clipped ("Trade-off: simpler travels better; richer needs support"). With thinking turned off it still emitted about 5× more output tokens than its visible text, so it costs about twice DeepSeek.
- **Gemma:** contradicted itself ("No." then "the briefing does not state…" for the Moss server question; "Yes, the takeover risk is moderate"). It is cheapest, but the weakest at answering first.
- **Qwen:** concise and accurate, but slowest (5.2 s off, 12.7 s with low reasoning) and its output tokens cost 2.7× DeepSeek's.
- **Low reasoning** didn't improve DeepSeek's or Inkling's rule compliance and added latency, so reasoning stays off.

### Proposed model plan

| Job | Model | Why |
|---|---|---|
| Capability picks, Plan flags (`wantsOrgModels`, `wantsMoney`), "Other" → closest option | **Clef-flash** | Most precise, fastest, calibrated probabilities. "Other" mapping becomes a `choice` question whose criteria are that field's real options, which fixes the round 1 `mappedTo` problem. |
| Need wording, search queries, notes, Compose prose, follow-up chat | **DeepSeek V4.1 Flash** (reasoning off) | Best query retrieval, answers first, short, grounded, about half Inkling's cost |
| Fallback for picks / writing | Gemma 4 | Cheap, reliable schema output |

## Round 1: Plan step (superseded)

Run on Nov 24, 2026 against the `m0-spike` Preview (`m0-spike-groundwork.superbenefit.workers.dev`), through the `default` AI Gateway (the `groundwork` gateway id was not found from the Worker; see below). Runner: a round-1 script since replaced by `evals/models.mjs`. Personas: `evals/personas.ts`.

Each call is one `generateText` with `Output.object({ schema: Plan })`, non-streaming, temperature 0.2, **reasoning off** (`reasoningEffort: null`, `chat_template_kwargs.enable_thinking: false`).

A pass means the output fits the schema, has 2–5 needs, and every `affordanceId` exists in OpenHaven's vocabulary.

## Results

| Model | Plan pass | p50 latency | Notes |
|---|---|---|---|
| `@cf/google/gemma-4-26b-a4b-it` | 10/10 | 3.4 s | Picks match the questions closely. "Other" notes are short and plain. |
| `@cf/qwen/qwen3.8-27b` | 10/10 | 3.6 s | Picks are sound. "Other" notes are long (up to 90 words), which breaks the brevity rule. |
| `@cf/zai-org/glm-4.7-flash` | 10/10 | 2.2 s | Fastest. Picks drift (for example `non-monetary-exchange` for a grants budget). `mappedTo` sometimes echoes the raw text. |

The first run had 27/30. All three failures were one persona fixture missing `decision`, which failed the Profile check before any model call. After the fix, all three models passed it.

## Findings

- **Reasoning must be off for structured calls.** With it on, Gemma took 64–93 s and produced 3–4k output tokens for one Plan. With it off: 2.5 s and about 107 tokens.
- **Tail latency.** About 1 call in 10 took 26–40 s on every model, with the same output size, which points to queueing rather than generation. The Plan step needs a timeout of about 20 s with one retry, and the research screen must tolerate it.
- **"Other" answers.** With `otherMappings` optional, all models returned an empty list. It is now required, and the prompt names the fields that need an entry. All models then mapped every free-text answer. `mappedTo` is used inconsistently (capability id, raw text, "other"). M1 change: give each field its own enum of allowed options.
- **Scope.** Only Plan was evaluated; Compose and chat don't exist yet. Compose is evaluated with the validator in M1, chat in M3.

## Decision

- `MODEL_PLAN` and `MODEL_COMPOSE`: `@cf/google/gemma-4-26b-a4b-it` (unchanged).
- `MODEL_CHAT`: `@cf/qwen/qwen3.8-27b` (unchanged), to be confirmed by the M3 chat eval.
- `@cf/zai-org/glm-4.7-flash` stays a fallback candidate for Plan.

## Raw results (first run)

| Model | Plan pass | p50 ms |
|---|---|---|
| @cf/google/gemma-4-26b-a4b-it | 9/10 | 3362 |
| @cf/qwen/qwen3.8-27b | 9/10 | 3636 |
| @cf/zai-org/glm-4.7-flash | 9/10 | 2183 |

| Model | Persona | Pass | ms | Needs | Error |
|---|---|---|---|---|---|
| @cf/google/gemma-4-26b-a4b-it | riverside | ✓ | 2527 | consent-governance transparent-resource-governance |  |
| @cf/google/gemma-4-26b-a4b-it | repair-network | ✓ | 2967 | decentralized-calendar cross-instance-federation data-portability |  |
| @cf/google/gemma-4-26b-a4b-it | solo-researcher | ✓ | 3660 | local-first-storage offline-mesh interoperable-formats |  |
| @cf/google/gemma-4-26b-a4b-it | housing-coop | ✓ | 3362 | consent-governance slow-deliberation dissent-pathways |  |
| @cf/google/gemma-4-26b-a4b-it | grants-dao | ✓ | 3290 | transparent-resource-governance consent-governance provenance-tracking |  |
| @cf/google/gemma-4-26b-a4b-it | mutual-aid | ✓ | 26417 | private-need-expression relational-matching |  |
| @cf/google/gemma-4-26b-a4b-it | worker-coop | ✓ | 3726 | composable-groups consent-governance transparent-resource-governance |  |
| @cf/google/gemma-4-26b-a4b-it | festival | ✓ | 3559 | offline-mesh local-first-storage decentralized-calendar |  |
| @cf/google/gemma-4-26b-a4b-it | seed-library | ✕ |  |  | [
  {
    "code": "invalid_value",
    "values": [
      "single",
      "consen |
| @cf/google/gemma-4-26b-a4b-it | startup-team | ✓ | 3101 | knowledge-commons data-portability version-controlled-memory |  |
| @cf/qwen/qwen3.8-27b | riverside | ✓ | 3636 | transparent-resource-governance consent-governance |  |
| @cf/qwen/qwen3.8-27b | repair-network | ✓ | 3172 | decentralized-calendar data-portability |  |
| @cf/qwen/qwen3.8-27b | solo-researcher | ✓ | 4619 | local-first-storage data-portability |  |
| @cf/qwen/qwen3.8-27b | housing-coop | ✓ | 40513 | consent-governance dissent-pathways slow-deliberation |  |
| @cf/qwen/qwen3.8-27b | grants-dao | ✓ | 3592 | transparent-resource-governance sovereign-identity |  |
| @cf/qwen/qwen3.8-27b | mutual-aid | ✓ | 9266 | private-need-expression relational-matching |  |
| @cf/qwen/qwen3.8-27b | worker-coop | ✓ | 2458 | consent-governance transparent-resource-governance |  |
| @cf/qwen/qwen3.8-27b | festival | ✓ | 3368 | offline-mesh composable-groups local-first-storage |  |
| @cf/qwen/qwen3.8-27b | seed-library | ✕ |  |  | [
  {
    "code": "invalid_value",
    "values": [
      "single",
      "consen |
| @cf/qwen/qwen3.8-27b | startup-team | ✓ | 31719 | data-portability provenance-tracking knowledge-commons |  |
| @cf/zai-org/glm-4.7-flash | riverside | ✓ | 2678 | consent-governance transparent-resource-governance |  |
| @cf/zai-org/glm-4.7-flash | repair-network | ✓ | 3015 | data-portability non-monetary-exchange nested-coordination |  |
| @cf/zai-org/glm-4.7-flash | solo-researcher | ✓ | 1655 | local-first-storage offline-mesh |  |
| @cf/zai-org/glm-4.7-flash | housing-coop | ✓ | 2183 | consent-governance slow-deliberation dissent-pathways version-controlled-memory |  |
| @cf/zai-org/glm-4.7-flash | grants-dao | ✓ | 1966 | transparent-resource-governance non-monetary-exchange |  |
| @cf/zai-org/glm-4.7-flash | mutual-aid | ✓ | 34897 | private-need-expression relational-matching |  |
| @cf/zai-org/glm-4.7-flash | worker-coop | ✓ | 2028 | consent-governance version-controlled-memory |  |
| @cf/zai-org/glm-4.7-flash | festival | ✓ | 2110 | offline-mesh data-portability non-monetary-exchange |  |
| @cf/zai-org/glm-4.7-flash | seed-library | ✕ |  |  | [
  {
    "code": "invalid_value",
    "values": [
      "single",
      "consen |
| @cf/zai-org/glm-4.7-flash | startup-team | ✓ | 4492 | version-controlled-memory data-portability |  |
