// M0 model eval: runs the Plan step for every persona on every candidate model
// against a deployed Preview, then prints a markdown table for docs/model-eval.md.
// Usage: node scripts/eval.mjs <preview-url> "@cf/a,@cf/b" "&gateway=default&think=0"
const [base = "https://m0-spike-groundwork.superbenefit.workers.dev", list, extra = ""] = process.argv.slice(2);
const models = (list ?? "@cf/google/gemma-4-26b-a4b-it,@cf/qwen/qwen3.8-27b,@cf/zai-org/glm-4.7-flash").split(",");
const personas = await (await fetch(`${base}/api/m0/personas`)).json();
const rows = [];
for (const model of models) {
  for (const persona of personas) {
    const r = await (await fetch(`${base}/api/m0/plan?model=${encodeURIComponent(model)}&persona=${persona}${extra}`)).json();
    const ok = r.ok && r.dropped.length === 0 && r.plan.needs.length >= 2;
    rows.push({ model, persona, ok, ms: r.ms ?? null, needs: r.plan?.needs?.map((n) => n.affordanceId).join(" ") ?? "", dropped: r.dropped?.length ?? 0, error: r.error ?? "" });
    console.error(`${model} ${persona} ${ok ? "pass" : "FAIL"} ${r.ms ?? ""}ms ${r.error ?? ""}`);
  }
}
const summary = models.map((m) => {
  const rs = rows.filter((r) => r.model === m);
  const ms = rs.map((r) => r.ms).filter(Boolean).sort((a, b) => a - b);
  return `| ${m} | ${rs.filter((r) => r.ok).length}/${rs.length} | ${ms[Math.floor(ms.length / 2)] ?? "–"} |`;
});
console.log(["| Model | Plan pass | p50 ms |", "|---|---|---|", ...summary, "", "| Model | Persona | Pass | ms | Needs | Error |", "|---|---|---|---|---|---|",
  ...rows.map((r) => `| ${r.model} | ${r.persona} | ${r.ok ? "✓" : "✕"} | ${r.ms ?? ""} | ${r.needs} | ${r.error.slice(0, 80)} |`)].join("\n"));
