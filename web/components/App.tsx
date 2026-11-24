import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { useAgent } from "agents/react";
import type { WorkspaceState } from "../../src/agents/workspace";
import { ensureSession } from "../lib/session";
import { Onboarding } from "./Onboarding";
import type { Answers } from "../lib/answers";
import "./onboarding.css";

const Connection = lazy(() => import("./Connection"));
const Research = lazy(() => import("./Research").then((m) => ({ default: m.Research })));
const Returning = lazy(() => import("./Returning").then((m) => ({ default: m.Returning })));

export type Workspace = ReturnType<typeof useAgent<WorkspaceState>>;
export type View = { kind: "home" } | { kind: "onboard"; groupId?: string; answers?: Answers; startAt?: number } | { kind: "run"; name: string; question: string };

/** Set when this browser has saved a group, so a repeat visit waits for the returning screen instead of showing the welcome. */
const HINT = "gw.returning";
const readHint = () => { try { return localStorage.getItem(HINT) === "1"; } catch { return false; } };
const writeHint = (on: boolean) => { try { if (on) localStorage.setItem(HINT, "1"); else localStorage.removeItem(HINT); } catch { /* private mode */ } };

const Boot = ({ error }: { error?: string | null }) => <div className="gw-boot" aria-live="polite">{error ?? ""}</div>;

/**
 * Home page. The welcome screen is prerendered and shown at once; the session check, Turnstile
 * and the workspace connection run in the background. Only starting a briefing waits for them.
 */
export function App() {
  const box = useRef<HTMLDivElement>(null);
  const [ws, setWs] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agent, setAgent] = useState<Workspace | null>(null);
  const [state, setState] = useState<WorkspaceState | null>(null);
  const [view, setView] = useState<View>({ kind: "home" });
  // The prerendered HTML is the welcome screen; a returning browser switches before first paint.
  const [returning, setReturning] = useState(false);

  const live = useRef<Workspace | null>(null);
  const failed = useRef<Error | null>(null);
  const waiting = useRef<{ resolve: (w: Workspace) => void; reject: (e: Error) => void }[]>([]);

  useLayoutEffect(() => setReturning(readHint()), []);
  useEffect(() => {
    document.documentElement.removeAttribute("data-gw-returning");
    if (!box.current) return;
    ensureSession(box.current).then(setWs, (e: Error) => {
      failed.current = e;
      setError(e.message);
      for (const w of waiting.current.splice(0)) w.reject(e);
    });
  }, []);
  useEffect(() => {
    if (!agent || !state) return;
    live.current = agent;
    for (const w of waiting.current.splice(0)) w.resolve(agent);
  }, [agent, state]);
  useEffect(() => {
    if (!state) return;
    writeHint(state.groups.length > 0);
    setReturning(state.groups.length > 0);
  }, [state]);

  /** Resolves with the connected workspace; Onboarding awaits it when the visitor asks for a briefing. */
  const ready = useCallback((): Promise<Workspace> => {
    if (live.current) return Promise.resolve(live.current);
    if (failed.current) return Promise.reject(failed.current);
    return new Promise((resolve, reject) => waiting.current.push({ resolve, reject }));
  }, []);

  const hasGroups = state ? state.groups.length > 0 : returning;
  let screen;
  if (view.kind === "run") screen = <Research name={view.name} question={view.question} onBack={() => setView({ kind: "home" })} />;
  else if (view.kind === "onboard" || !hasGroups) {
    const v = view.kind === "onboard" ? view : { kind: "onboard" as const };
    screen = <Onboarding key={v.groupId ?? "new"} ready={ready} groupId={v.groupId} initial={v.answers} startAt={v.startAt} onRun={(name, question) => setView({ kind: "run", name, question })} onCancel={hasGroups ? () => setView({ kind: "home" }) : undefined} />;
  } else if (!agent || !state) screen = <Boot error={error} />;
  else screen = <Returning workspace={agent} state={state} setView={setView} />;

  return (
    <>
      <Suspense fallback={<Boot />}>{screen}</Suspense>
      {ws && <Suspense fallback={null}><Connection workspaceId={ws} onAgent={setAgent} onState={setState} /></Suspense>}
      <div ref={box} className="gw-turnstile" />
    </>
  );
}
