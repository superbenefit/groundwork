import { useEffect, useRef, useState } from "react";
import { useAgent } from "agents/react";
import type { WorkspaceState } from "../../src/agents/workspace";
import { ensureSession } from "../lib/session";
import { Onboarding } from "./Onboarding";
import { Returning } from "./Returning";
import { Research } from "./Research";
import type { Answers } from "../lib/answers";
import "./onboarding.css";

export type Workspace = ReturnType<typeof useAgent<WorkspaceState>>;
export type View = { kind: "home" } | { kind: "onboard"; groupId?: string; answers?: Answers; startAt?: number } | { kind: "run"; name: string; question: string };

/** Home page: session first, then onboarding (new visitors) or the returning screen. */
export function App() {
  const box = useRef<HTMLDivElement>(null);
  const [ws, setWs] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (box.current) ensureSession(box.current).then(setWs, (e: Error) => setError(e.message));
  }, []);
  return (
    <>
      {ws ? <Home workspaceId={ws} /> : <div className="gw-boot" aria-live="polite">{error ?? ""}</div>}
      <div ref={box} className="gw-turnstile" />
    </>
  );
}

function Home({ workspaceId }: { workspaceId: string }) {
  const [state, setState] = useState<WorkspaceState | null>(null);
  const [view, setView] = useState<View>({ kind: "home" });
  const agent = useAgent<WorkspaceState>({ agent: "workspace-agent", name: workspaceId, onStateUpdate: (s) => setState(s) });
  useEffect(() => { agent.stub.visit().catch(() => undefined); }, [agent]);

  if (!state) return <div className="gw-boot" aria-live="polite" />;
  if (view.kind === "run") return <Research name={view.name} question={view.question} onBack={() => setView({ kind: "home" })} />;
  if (view.kind === "onboard" || state.groups.length === 0) {
    const v = view.kind === "onboard" ? view : { kind: "onboard" as const };
    return <Onboarding key={v.groupId ?? "new"} workspace={agent} state={state} groupId={v.groupId} initial={v.answers} startAt={v.startAt} onRun={(name, question) => setView({ kind: "run", name, question })} onCancel={state.groups.length ? () => setView({ kind: "home" }) : undefined} />;
  }
  return <Returning workspace={agent} state={state} setView={setView} />;
}
