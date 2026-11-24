import { useEffect, useRef, useState } from "react";
import { useAgent } from "agents/react";
import type { BriefingState } from "../../src/agents/briefing";
import type { Profile } from "../../src/shared/schema";
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

export function rememberSession(name: string, profile: Profile, question: string) {
  try {
    const list = JSON.parse(localStorage.getItem("gw.sessions") ?? "[]") as { name: string; group: string; question: string; at: number }[];
    if (!list.some((s) => s.name === name)) list.unshift({ name, group: profile.name, question, at: Date.now() });
    localStorage.setItem("gw.sessions", JSON.stringify(list.slice(0, 20)));
  } catch { /* private mode */ }
}

export function Research({ name, profile, question, onBack }: { name: string; profile: Profile; question: string; onBack?: () => void }) {
  const [state, setState] = useState<BriefingState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const agent = useAgent<BriefingState>({
    agent: "briefing-agent",
    name,
    onStateUpdate: (s) => setState(s),
  });

  useEffect(() => {
    if (started.current || !state) return;
    if (state.phase === "idle") {
      started.current = true;
      rememberSession(name, profile, question);
      agent.stub.start(profile, question).catch((e: unknown) => setError(String((e as Error)?.message ?? e)));
    }
  }, [state, agent, name, profile, question]);

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
              <button type="button" className="gw-btn" onClick={() => agent.stub.retryRun()}>Try again</button>
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
