import type { z } from "zod";

/**
 * Thin wrappers over env.AI.run for the two kinds of model call the pipeline makes.
 * Every call goes through the AI Gateway, has reasoning off, a timeout and one retry.
 */

export type ModelEnv = Pick<Env, "AI" | "AI_GATEWAY_ID" | "MODEL_PICK" | "MODEL_WRITE" | "MODEL_FALLBACK">;
export type Usage = { model: string; ms: number; inTokens: number; outTokens: number };

const TIMEOUT_MS = 25_000;

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const t = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`model call timed out after ${ms} ms`)), ms);
  });
  try {
    return await Promise.race([p, t]);
  } finally {
    clearTimeout(timer);
  }
}

async function runOnce(env: ModelEnv, model: string, input: Record<string, unknown>) {
  return withTimeout(
    env.AI.run(model as keyof AiModels, input as never, { gateway: { id: env.AI_GATEWAY_ID, skipCache: true } }) as Promise<Record<string, any>>,
    TIMEOUT_MS,
  );
}

/** Reasoning-off switches differ by model family (docs/evals/models.md). */
export function noReasoning(model: string): Record<string, unknown> {
  return model.includes("deepseek") ? { reasoning_effort: "none" } : { chat_template_kwargs: { enable_thinking: false } };
}

export type DecisionQuestion =
  | { type: "noul"; instructions: string }
  | { type: "choice"; instructions: string; criteria: Record<string, string> };
export type DecisionAnswer = { type: "noul"; noul: number } | { type: "choice"; choice: string; confidence?: number; probabilities?: Record<string, number> };

/** System One decision call (Clef-flash). Up to 64 questions per request. */
export async function decide(
  env: ModelEnv,
  state: string,
  questions: Record<string, DecisionQuestion>,
): Promise<{ answers: Record<string, DecisionAnswer>; usage: Usage }> {
  const model = env.MODEL_PICK;
  const selector = model.split("/").pop()!;
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const t = Date.now();
    try {
      const r = await runOnce(env, model, { model: selector, state, questions });
      return { answers: r.answers, usage: { model, ms: Date.now() - t, inTokens: r.usage?.input_tokens ?? 0, outTokens: 0 } };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

/**
 * Structured writing call: JSON schema output, parsed with zod. Tries MODEL_WRITE twice,
 * then MODEL_FALLBACK once. `extraUser` carries validator feedback on a retry.
 */
export async function writeJson<T extends z.ZodTypeAny>(
  env: ModelEnv,
  opts: { system: string; user: string; schema: T; jsonSchema: Record<string, unknown>; temperature?: number },
): Promise<{ value: z.infer<T>; usage: Usage }> {
  const attempts = [env.MODEL_WRITE, env.MODEL_WRITE, env.MODEL_FALLBACK];
  let lastErr: unknown;
  for (const model of attempts) {
    const t = Date.now();
    try {
      const r = await runOnce(env, model, {
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.user },
        ],
        response_format: { type: "json_schema", json_schema: opts.jsonSchema },
        temperature: opts.temperature ?? 0.3,
        max_tokens: 3000,
        ...noReasoning(model),
      });
      const content = r.choices?.[0]?.message?.content ?? r.response;
      const raw = typeof content === "string" ? JSON.parse(stripFences(content)) : content;
      const value = opts.schema.parse(raw);
      return { value, usage: { model, ms: Date.now() - t, inTokens: r.usage?.prompt_tokens ?? 0, outTokens: r.usage?.completion_tokens ?? 0 } };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

const stripFences = (s: string) => s.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
