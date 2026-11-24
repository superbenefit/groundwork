import { useEffect, useRef, useState } from "react";
import { useAgent } from "agents/react";
import type { BriefingState } from "../../src/agents/briefing";
import { Briefing } from "./Briefing";
import { AskButton, FollowUp } from "./FollowUp";
import { Brand } from "./Brand";
import { Research } from "./Research";
import "./briefing-page.css";

export function BriefingPage() {
  const [name, setName] = useState<string | null>(null);
  useEffect(() => setName(new URLSearchParams(location.search).get("s")), []);
  if (name === null) return null;
  if (!name) return <Missing />;
  return <Connected name={name} />;
}

function show(toolId: string) {
  const els = [document.getElementById(`opt-${toolId}`), document.getElementById(`card-${toolId}`)].filter((e): e is HTMLElement => !!e && e.offsetParent !== null);
  const el = els[0];
  if (!el) return;
  el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
  el.classList.remove("gw-pulse");
  void el.offsetWidth;
  el.classList.add("gw-pulse");
}

function Connected({ name }: { name: string }) {
  const [state, setState] = useState<BriefingState | null>(null);
  const [open, setOpen] = useState(false);
  const agent = useAgent<BriefingState>({ agent: "briefing-agent", name, onStateUpdate: (s) => setState(s) });
  // React only to highlights made after the page loaded, not one left from an earlier visit.
  const seenHighlight = useRef<number | null>(null);
  useEffect(() => {
    if (!state) return;
    const at = state.highlight?.at ?? 0;
    if (seenHighlight.current === null) { seenHighlight.current = at; return; }
    if (at > seenHighlight.current && state.highlight) {
      seenHighlight.current = at;
      if (window.matchMedia("(max-width: 760px)").matches) setOpen(false);
      const id = state.highlight.toolId;
      setTimeout(() => show(id), 50);
    }
  }, [state]);

  if (!state) return <div className="gw-page-loading" aria-live="polite">Loading the briefing…</div>;
  if (state.phase === "idle") return <Missing />;
  if (state.phase !== "done" || !state.briefing || !state.profile) {
    return <Research name={name} profile={state.profile!} question={state.question ?? ""} />;
  }
  return (
    <div className="gw-page">
      <div className="gw-topbar gw-noprint">
        <div className="gw-topbar-left">
          <span className="gw-desktop-only"><Brand /></span>
          <span className="gw-topbar-group">{state.profile.name}</span>
        </div>
        <a href="/" className="gw-topbar-link">New question</a>
      </div>
      <Briefing briefing={state.briefing} profile={state.profile} />
      {!open && <AskButton onClick={() => setOpen(true)} />}
      {open && (
        <FollowUp
          agent={agent}
          briefing={state.briefing}
          legal={state.profile.legal}
          onClose={() => setOpen(false)}
          onShow={(id) => { if (window.matchMedia("(max-width: 760px)").matches) setOpen(false); setTimeout(() => show(id), 50); }}
          ask={(t) => agent.stub.ask(t)}
          addAnswer={(id) => agent.stub.addAnswer(id)}
        />
      )}
    </div>
  );
}

function Missing() {
  return (
    <div className="gw-page gw-missing">
      <div className="gw-topbar"><Brand /></div>
      <main>
        <h1>This briefing isn't here</h1>
        <p>It may have been removed after 30 days without use, or the link is incomplete.</p>
        <a className="gw-btn" href="/">Start a new briefing</a>
      </main>
    </div>
  );
}
