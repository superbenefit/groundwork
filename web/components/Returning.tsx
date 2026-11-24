import { useEffect, useState } from "react";
import type { WorkspaceState } from "../../src/agents/workspace";
import type { Profile } from "../../src/shared/schema";
import { CHOICES, emptyAnswers, type Answers } from "../lib/answers";
import { Brand } from "./Brand";
import { PoweredBy } from "./PoweredBy";
import type { View, Workspace } from "./App";
import "./followup.css";
import "./returning.css";

const SETUP: Record<string, string> = { none: "no setup", guided: "a little setup", developer: "a developer" };
const DECIDE: Record<string, string> = { single: "one person decides", consensus: "decide by agreement", vote: "decide by vote", roles: "each role decides", board: "a board decides", unsettled: "decisions not settled" };

/** One line summing up a group's saved answers (mockup NewSession.dc.html). */
export function shape(p: Profile): string {
  const label = (step: number, v: string, f: keyof Profile["other"]) => (v === "other" ? p.other?.[f] : CHOICES[step]?.opts.find((o) => o.value === v)?.label);
  const limits = p.limits.map((l) => ({ crypto: "no crypto", cost: "no cost", server: "no server", mobile: "phone app needed", offline: "works offline", export: "data export" })[l]);
  return [
    label(2, p.scale, "scale")?.replace(/^2 to 10$/, "2 to 10 people"),
    label(3, p.reach, "reach")?.toLowerCase(),
    p.decision === "other" ? p.other?.decision : DECIDE[p.decision],
    ...limits,
    p.setup === "other" ? p.other?.setup : SETUP[p.setup],
  ].filter(Boolean).join(", ");
}

function answersFrom(g: WorkspaceState["groups"][number]): Answers {
  if (g.answers && typeof g.answers === "object") return { ...emptyAnswers(), ...(g.answers as Answers), name: g.name };
  const p = g.profile;
  return { ...emptyAnswers(), name: p.name, purpose: p.purpose, scale: p.scale, reach: p.reach, decision: p.decision, leans: p.leans, leanNote: p.leanNote ?? "", limits: p.limits, limitsOther: !!p.other?.limits, setup: p.setup, legal: p.legal, other: { ...p.other } };
}

const REFUSED: Record<string, (resetsAt?: string) => string> = {
  weekly_cap: (r) => `This demo allows 20 briefings a week per browser. More are available from ${r ? new Date(r).toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" }) : "Monday"}.`,
  rate: () => "That's several briefings in a minute. Wait a moment and try again.",
  not_found: () => "That group isn't here any more. Choose another or add a group.",
};

export function Returning({ workspace, state, setView }: { workspace: Workspace; state: WorkspaceState; setView: (v: View) => void }) {
  const group = state.groups.find((g) => g.id === state.currentGroupId) ?? state.groups[0]!;
  const sessions = state.sessions.filter((s) => s.groupId === group.id);
  const last = sessions.find((s) => s.status === "done");
  const [question, setQuestion] = useState("");
  const [sheet, setSheet] = useState<null | "groups" | "past">(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => { setQuestion(""); setNotice(null); }, [group.id]);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && setSheet(null); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);

  const find = async () => {
    const q = question.trim();
    if (!q || busy) return;
    setBusy(true);
    setNotice(null);
    const r = await workspace.stub.startSession(group.id, q).catch((e: Error) => ({ refused: "error", message: e.message }) as const);
    setBusy(false);
    if ("name" in r) setView({ kind: "run", name: r.name, question: q });
    else setNotice("message" in r ? r.message : REFUSED[r.refused]?.(r.resetsAt) ?? "Couldn't start the briefing.");
  };

  return (
    <div className="gw-ob gw-ret">
      <div className="gw-ob-bar">
        <div className="gw-ob-bar-left gw-ret-left">
          <span aria-hidden="true" className="gw-brand-mark" />
          <button type="button" className="gw-ret-group" aria-haspopup="dialog" onClick={() => setSheet("groups")}>
            {group.name}
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
          </button>
        </div>
        {sessions.length > 0 && <button type="button" className="gw-ret-past" onClick={() => setSheet("past")}>Past briefings ({sessions.length})</button>}
      </div>

      <main className="gw-ob-col gw-ob-main gw-ret-main">
        <h1 className="gw-qtitle gw-up">What do you need help with now?</h1>
        <p className="gw-ret-shape gw-up gw-s1">Saved answers: {shape(group.profile)}. <button type="button" className="gw-inline-link" onClick={() => setView({ kind: "onboard", groupId: group.id, answers: answersFrom(group), startAt: 10 })}>Edit</button></p>
        <label className="gw-lbl gw-up gw-s1">Your question
          <textarea className="gw-field" rows={3} value={question} maxLength={400} placeholder="Ask about a decision, a tool or a problem your group has." onChange={(e) => setQuestion(e.target.value)} />
        </label>
        {last && last.followOns.length > 0 && (
          <div className="gw-ret-follow gw-up gw-s2">
            <span className="gw-eyebrow-red">From your last briefing</span>
            {last.followOns.map((f) => <button key={f} type="button" className="gw-ret-chip" onClick={() => setQuestion(f)}>{f}</button>)}
          </div>
        )}
        {state.usage.runsLeft < 5 && <p className="gw-ret-cap">{state.usage.runsLeft} {state.usage.runsLeft === 1 ? "briefing" : "briefings"} left this week in this browser.</p>}
        {notice && <p className="gw-ret-notice" role="status">{notice}</p>}
        <div className="gw-flex" />
        <button type="button" className="gw-btn gw-btn-big gw-btn-red gw-up gw-s2" disabled={!question.trim() || busy} onClick={find}>{busy ? "Starting…" : "Find tools"}</button>
      </main>

      <div className="gw-ob-foot"><PoweredBy /></div>

      {sheet && (
        <div className="gw-sheet-wrap">
          <div className="gw-sheet-scrim" aria-hidden="true" onClick={() => setSheet(null)} />
          <section className="gw-sheet" role="dialog" aria-modal="true" aria-label={sheet === "groups" ? "Switch group" : "Past briefings"}>
            <div className="gw-fu-handle" aria-hidden="true" />
            <div className="gw-sheet-head">
              <h2>{sheet === "groups" ? "Switch group" : "Past briefings"}</h2>
              <button type="button" className="gw-fu-close" aria-label="Close" onClick={() => setSheet(null)}>
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            {sheet === "groups" && (
              <>
                {state.groups.map((g) => (
                  <button key={g.id} type="button" className={`gw-sheet-row${g.id === group.id ? " on" : ""}`} aria-pressed={g.id === group.id} onClick={() => { workspace.stub.selectGroup(g.id); setSheet(null); }}>
                    <span className="gw-sheet-row-text"><span className="gw-sheet-name">{g.name}</span><span className="gw-sheet-short">{g.short}</span></span>
                    <span className="gw-sheet-mark">{g.id === group.id ? "Current" : ""}</span>
                  </button>
                ))}
                <button type="button" className="gw-sheet-add" onClick={() => setView({ kind: "onboard" })}>
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>Add a group
                </button>
                <p className="gw-sheet-note">Each group keeps its own answers and briefings. Groups are deleted after 30 days without use.</p>
              </>
            )}
            {sheet === "past" && sessions.map((s) => (
              <a key={s.id} className="gw-sheet-row" href={`/briefing?s=${encodeURIComponent(s.name)}`}>
                <span className="gw-sheet-row-text"><span className="gw-sheet-name">{s.title ?? (s.status === "failed" ? "Research stopped" : "In progress")}</span><span className="gw-sheet-short">{s.question}</span></span>
                <span className="gw-sheet-mark">{new Date(s.created).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
              </a>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}

