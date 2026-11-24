# M0 model eval: Plan step

Run on Nov 24, 2026 against the `m0-spike` Preview (`m0-spike-groundwork.superbenefit.workers.dev`), through the `default` AI Gateway (the `groundwork` gateway id was not found from the Worker; see below). Runner: `scripts/eval.mjs`. Personas: `src/eval/personas.ts`.

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
