import { useState } from "react";
import { useAgent } from "agents/react";
import type { BriefingState } from "../../src/agents/briefing";
import { Brand } from "./Brand";
import { PoweredBy } from "./PoweredBy";
import "./onboarding.css";

const DETAIL: Record<string, string> = {
  plan: "Working out what you need a tool to do",
  weigh: "Speed or say, fixed or flexible rules, software or judgement",
  retrieve: "Comparing 273 tools, 16 ways to organize and 34 ways to fund",
  assess: "Checking each tool against what you ruled out",
  compose: "",
};

/** Watches a run the workspace started; the steps tick off as the agent reports them. */
export function Research({ name, question, onBack }: { name: string; question: string; onBack?: () => void }) {
  const [state, setState] = useState<BriefingState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const agent = useAgent<BriefingState>({
    agent: "briefing-agent",
    name,
    onStateUpdate: (s) => setState(s),
    onStateUpdateError: (e: unknown) => setError(String((e as Error)?.message ?? e)),
  });

  const steps = state?.steps ?? [];
  const done = state?.phase === "done";
  const failed = state?.phase === "failed" || !!error;
  const setAside = state?.briefing?.blocks.find((b) => b.kind === "setAside");
  const status = failed
    ? "The research stopped before it finished."
    : done
      ? `Done. ${state?.counts?.options ?? 0} ${state?.counts?.options === 1 ? "option" : "options"} found, ${setAside && setAside.kind === "setAside" ? setAside.items.length : 0} set aside.`
      : "Working. This takes about 30 seconds.";

  return (
    <div className="gw-ob">
      <div className="gw-ob-bar"><div className="gw-ob-bar-left"><Brand /></div></div>
      <main className="gw-ob-col gw-ob-main">
        <div className="gw-run gw-fade">
          <div className="gw-run-status" aria-live="polite">
            {!done && !failed && <span className="gw-spin" aria-hidden="true" />}
            <span>{status}</span>
          </div>
          <p className="gw-run-q">“{question}”</p>
          <ol className="gw-run-steps" aria-live="polite">
            {(steps.length ? steps : Object.keys(DETAIL).map((key) => ({ key, label: "", status: "pending" as const, detail: undefined }))).map((s) => (
              <li key={s.key} className={`gw-run-step ${s.status}`}>
                <span aria-hidden="true" className="gw-run-mark">{s.status === "done" ? "✓" : ""}</span>
                <span className="gw-run-text">
                  <span className="gw-run-label">{s.label}</span>
                  <span className="gw-run-detail">{s.detail ?? DETAIL[s.key]}</span>
                </span>
              </li>
            ))}
          </ol>
          {failed && (
            <div className="gw-run-fail">
              <p>{error ?? state?.error}</p>
              <button type="button" className="gw-btn" onClick={() => agent.stub.retryRun().catch((e: unknown) => setError(String((e as Error)?.message ?? e)))}>Try again</button>
              {onBack && <button type="button" className="gw-link-btn" onClick={onBack}>Back to your answers</button>}
            </div>
          )}
          <div className="gw-flex" />
          {done && <a className="gw-btn gw-btn-big gw-btn-red gw-up" href={`/briefing?s=${encodeURIComponent(name)}`}>Read your briefing</a>}
        </div>
      </main>
      <div className="gw-ob-foot"><PoweredBy /></div>
    </div>
  );
}
