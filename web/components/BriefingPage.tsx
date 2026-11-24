import { useEffect, useState } from "react";
import { useAgent } from "agents/react";
import type { BriefingState } from "../../src/agents/briefing";
import { Briefing } from "./Briefing";
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

function Connected({ name }: { name: string }) {
  const [state, setState] = useState<BriefingState | null>(null);
  useAgent<BriefingState>({ agent: "briefing-agent", name, onStateUpdate: (s) => setState(s) });

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
