import { useEffect, useMemo, useRef, useState } from "react";
import { CHOICES, EXAMPLES, LIMIT_OPTS, SCALES, emptyAnswers, storage, toProfile, type Answers, type ChoiceQ } from "../lib/answers";
import { Brand } from "./Brand";
import { PoweredBy } from "./PoweredBy";
import type { WorkspaceState } from "../../src/agents/workspace";
import type { Workspace } from "./App";
import "./onboarding.css";
import "./returning.css";

const KEYS = "ABCDEFGH";
const PART = (step: number) => (step <= 4 ? "Your group" : step <= 8 ? "How you work" : step === 9 ? "Your question" : "Check your answers");
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

type Props = {
  workspace: Workspace;
  state: WorkspaceState;
  /** Editing an existing group: its id and saved answers. */
  groupId?: string;
  initial?: Answers;
  startAt?: number;
  onRun: (name: string, question: string) => void;
  onCancel?: () => void;
};

const REFUSED: Record<string, string> = {
  weekly_cap: "This demo allows 20 briefings a week per browser. More are available from Monday.",
  rate: "That's several briefings in a minute. Wait a moment and try again.",
  not_found: "That group isn't here any more.",
};

export function Onboarding({ workspace, groupId, initial, startAt, onRun, onCancel }: Props) {
  const [a, setA] = useState<Answers>(() => initial ?? emptyAnswers());
  const [step, setStep] = useState(startAt ?? 0);
  const [dir, setDir] = useState<"up" | "down">("up");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const editing = !!groupId;

  useEffect(() => {
    if (initial) return;
    const saved = storage.load();
    if (saved) setA(saved);
  }, [initial]);
  const update = (patch: Partial<Answers>) => setA((prev) => { const next = { ...prev, ...patch }; if (!editing) storage.save(next); return next; });
  const first = startAt ?? 0;
  const stepRef = useRef(step);
  stepRef.current = step;

  // Each step is a browser history entry, so the phone back gesture and the browser
  // back button step back through the questions instead of leaving the page.
  useEffect(() => {
    history.replaceState({ ...(history.state ?? {}), gwStep: first }, "");
    const onPop = (e: PopStateEvent) => {
      clearTimeout(timer.current);
      const target = typeof e.state?.gwStep === "number" ? (e.state.gwStep as number) : null;
      if (target === null || target < first) { if (onCancel) onCancel(); else { setDir("down"); setStep(first); } return; }
      setDir(target < stepRef.current ? "down" : "up");
      setStep(target);
      window.scrollTo(0, 0);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [first, onCancel]);

  const go = (n: number) => {
    clearTimeout(timer.current);
    setDir(n < step ? "down" : "up");
    setStep(n);
    history.pushState({ ...(history.state ?? {}), gwStep: n }, "");
    window.scrollTo(0, 0);
  };
  const back = () => {
    clearTimeout(timer.current);
    if (step > first) history.back();
    else onCancel?.();
  };

  const canNext = useMemo(() => {
    if (step === 1) return a.purpose.trim().length > 0;
    if (step === 9) return a.question.trim().length > 0;
    if (step === 10) return a.name.trim().length > 0;
    return true;
  }, [step, a]);

  const start = async () => {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    try {
      const { groupId: id } = await workspace.stub.saveGroup(toProfile(a), a, groupId);
      const r = await workspace.stub.startSession(id, a.question.trim());
      if ("name" in r) {
        if (!editing) storage.clear();
        onRun(r.name, a.question.trim());
      } else setNotice(REFUSED[r.refused] ?? "Couldn't start the briefing.");
    } catch (e) {
      setNotice(String((e as Error)?.message ?? e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="gw-ob">
      <div className="gw-ob-bar">
        <div className="gw-ob-bar-left">
          {(step > first || (onCancel && step === first)) && (
            <button type="button" className="gw-back" onClick={back}>
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
              Back
            </button>
          )}
          <span className={step === 0 ? "" : "gw-desktop-only"}><Brand /></span>
        </div>
        {step >= 1 && <span className="gw-ob-saved">Answers saved as you go</span>}
      </div>

      {step >= 1 && (
        <div className="gw-ob-col gw-progress" role="progressbar" aria-valuemin={0} aria-valuemax={9} aria-valuenow={Math.min(step, 9)} aria-label={step === 10 ? "All 9 answered" : `Question ${step} of 9`}>
          <div className="gw-segs">
            {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
              <div key={n} className={`gw-seg ${n < step || step === 10 ? "done" : n === step ? "now" : ""}`} />
            ))}
          </div>
          <div className="gw-progress-text"><span className="gw-part">{PART(step)}</span><span>{step === 10 ? "All 9 answered" : `Question ${step} of 9`}</span></div>
        </div>
      )}

      <main className="gw-ob-col gw-ob-main">
        <div key={step} className={`gw-ob-frame gw-${dir}`}>
          {step === 0 && <Welcome onStart={() => go(1)} />}

          {step === 1 && (
            <TextQ num={1} title="What does your group do?" help="One or two sentences, in your own words." label="Your answer"
              value={a.purpose} onChange={(v) => update({ purpose: v })} placeholder="e.g. We run a community fridge and share surplus food." onNext={() => go(2)} canNext={canNext} />
          )}

          {[2, 3, 4, 7, 8].includes(step) && (
            <ChoiceQuestion q={CHOICES[step]!} value={a[CHOICES[step]!.field]} other={a.other[CHOICES[step]!.field] ?? ""}
              onPick={(v) => {
                const q = CHOICES[step]!;
                if (q.multi) {
                  const cur = a[q.field] as string[];
                  update({ [q.field]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] } as Partial<Answers>);
                  return;
                }
                update({ [q.field]: v } as Partial<Answers>);
                clearTimeout(timer.current);
                if (v !== "other") timer.current = setTimeout(() => go(step + 1), 450);
              }}
              onOther={(t) => update({ other: { ...a.other, [CHOICES[step]!.field]: t } })}
              onNext={() => go(step + 1)} />
          )}

          {step === 5 && (
            <div className="gw-q">
              <p className="gw-qnum">5 →</p>
              <h1 className="gw-qtitle">Where does your group lean?</h1>
              <p className="gw-qhelp">There's no right answer. Each pair trades one good thing for another. Tap a point on each line.</p>
              <div className="gw-scales">
                {SCALES.map((s, k) => {
                  const v = a.leans[s.key];
                  return (
                    <div key={s.key} className="gw-scale-q gw-up" style={{ animationDelay: `${0.06 * k + 0.05}s` }} role="radiogroup" aria-label={`${s.left} or ${s.right}`}>
                      <div className="gw-scale-labels"><span style={{ fontWeight: v <= 2 ? 600 : 400 }}>{s.left}</span><span style={{ fontWeight: v >= 4 ? 600 : 400 }}>{s.right}</span></div>
                      <div className="gw-scale-track">
                        <div className="gw-scale-rail" aria-hidden="true" />
                        {[1, 2, 3, 4, 5].map((p) => (
                          <button key={p} type="button" role="radio" aria-checked={v === p} className="gw-dot"
                            aria-label={p === 3 ? "Balanced" : `${p < 3 ? `Toward ${s.left}` : `Toward ${s.right}`}${p === 1 || p === 5 ? ", strongly" : ""}`}
                            onClick={() => update({ leans: { ...a.leans, [s.key]: p } })}>
                            <span aria-hidden="true" className={v === p ? "on" : ""} />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <label className="gw-other-label">Anything else about how your group works? Optional
                <input className="gw-other" value={a.leanNote} onChange={(e) => update({ leanNote: e.target.value })} placeholder="e.g. we rotate who chairs meetings" maxLength={280} />
              </label>
              <div className="gw-flex" />
              <button type="button" className="gw-btn" onClick={() => go(6)}>OK ✓</button>
            </div>
          )}

          {step === 6 && (
            <div className="gw-q">
              <p className="gw-qnum">6 →</p>
              <h1 className="gw-qtitle">What would rule a tool out?</h1>
              <p className="gw-qhelp">Choose any. Tools that break these are set aside, with the reason.</p>
              <div className="gw-opts" role="group" aria-label="What would rule a tool out?">
                {[...LIMIT_OPTS.map((o) => ({ ...o, on: a.limits.includes(o.value) })), { value: "other" as const, label: "Something else", on: a.limitsOther }].map((o, i) => (
                  <button key={o.value} type="button" className={`gw-opt gw-up${o.on ? " on" : ""}`} style={{ animationDelay: `${0.04 * i + 0.05}s` }} aria-pressed={o.on}
                    onClick={() => (o.value === "other" ? update({ limitsOther: !a.limitsOther }) : update({ limits: o.on ? a.limits.filter((x) => x !== o.value) : [...a.limits, o.value] }))}>
                    <span aria-hidden="true" className="gw-key">{KEYS[i]}</span><span className="gw-opt-label">{o.label}</span>
                  </button>
                ))}
              </div>
              {a.limitsOther && (
                <label className="gw-other-label gw-grow">Describe it
                  <input className="gw-other" autoFocus value={a.other.limits ?? ""} onChange={(e) => update({ other: { ...a.other, limits: e.target.value } })} placeholder="e.g. must work in French" maxLength={280} />
                </label>
              )}
              <div className="gw-flex" />
              <button type="button" className="gw-btn" onClick={() => go(7)}>OK ✓</button>
            </div>
          )}

          {step === 9 && (
            <div className="gw-q">
              <TextQ num={9} title="What do you need help with?" help="One question per briefing. Next time, you'll only need to answer this one." label="Your question"
                value={a.question} onChange={(v) => update({ question: v })} placeholder="Ask about a decision, a tool or a problem your group has." onNext={() => go(10)} canNext={canNext} maxLength={400} />
              <div className="gw-flex" />
              <div className="gw-examples gw-up gw-s3">
                <span>Need a starting point? Questions other groups asked:</span>
                {EXAMPLES.map((e) => <button key={e} type="button" className="gw-ex" onClick={() => update({ question: e })}>→ {e}</button>)}
              </div>
            </div>
          )}

          {step === 10 && (
            <div className="gw-q gw-check">
              <h1 className="gw-qtitle">Check your answers</h1>
              <label className="gw-name-label">Save this group as
                <input className="gw-field gw-name" value={a.name} onChange={(e) => update({ name: e.target.value })} placeholder="e.g. Riverside Tool Library" maxLength={80} />
              </label>
              <div className="gw-summary">
                {summary(a).map((r) => (
                  <button key={r.label} type="button" className="gw-sum-row" onClick={() => go(r.step)}>
                    <span className="gw-sum-text"><span className="gw-sum-label">{r.label}</span><span className="gw-sum-value">{r.value}</span></span>
                    <span className="gw-sum-edit">Edit</span>
                  </button>
                ))}
              </div>
              {notice && <p className="gw-ret-notice" role="status">{notice}</p>}
              <div className="gw-flex" />
              <button type="button" className="gw-btn gw-btn-big" disabled={!canNext || busy} onClick={start}>{busy ? "Starting…" : "Find tools"}</button>
            </div>
          )}
        </div>
      </main>

      {(step === 0) && <div className="gw-ob-foot"><PoweredBy /></div>}
      {step > 0 && <div className="gw-ob-foot gw-desktop-only"><PoweredBy /></div>}
    </div>
  );
}

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="gw-welcome">
      <div className="gw-welcome-body">
        <h1 className="gw-hero gw-up">Find open tools that fit your group.</h1>
        <p className="gw-lead-ob gw-up gw-s1">Answer nine short questions about your group, how it likes to work and what you need. Your answers are matched against more than 270 community-run tools. You'll see the options, the trade-offs between them, and what to ask before you choose.</p>
        <ul className="gw-steps-list gw-up gw-s2">
          <li><span>1</span>Describe your group and how it likes to work</li>
          <li><span>2</span>Ask one question</li>
          <li><span>3</span>Get a briefing to share with your group</li>
        </ul>
      </div>
      <div className="gw-welcome-cta gw-up gw-s3">
        <button type="button" className="gw-btn gw-btn-big" onClick={onStart}>Start</button>
        <p>About 3 minutes. Public demo: your answers stay in this browser.</p>
      </div>
    </div>
  );
}

function TextQ(p: { num: number; title: string; help: string; label: string; value: string; placeholder: string; onChange: (v: string) => void; onNext: () => void; canNext: boolean; maxLength?: number }) {
  return (
    <div className="gw-q">
      <p className="gw-qnum">{p.num} →</p>
      <h1 className="gw-qtitle">{p.title}</h1>
      <p className="gw-qhelp">{p.help}</p>
      <label className="gw-lbl gw-up gw-s1">{p.label}
        <textarea className="gw-field" rows={4} value={p.value} placeholder={p.placeholder} maxLength={p.maxLength ?? 500} autoFocus onChange={(e) => p.onChange(e.target.value)} />
      </label>
      <button type="button" className="gw-btn gw-up gw-s2" disabled={!p.canNext} onClick={p.onNext}>OK ✓</button>
    </div>
  );
}

function ChoiceQuestion({ q, value, other, onPick, onOther, onNext }: { q: ChoiceQ; value?: string | string[]; other: string; onPick: (v: string) => void; onOther: (t: string) => void; onNext: () => void }) {
  const opts = [...q.opts, { value: "other", label: "Other", sub: "" }];
  const chosen = Array.isArray(value) ? value : value ? [value] : [];
  const otherOn = chosen.includes("other");
  const canGo = q.multi ? chosen.length > 0 && (!otherOn || other.trim().length > 0) : !!other.trim();
  return (
    <div className="gw-q">
      <p className="gw-qnum">{q.step} →</p>
      <h1 className="gw-qtitle">{q.title}</h1>
      <p className="gw-qhelp">{q.help}</p>
      <div className="gw-opts" role={q.multi ? "group" : "radiogroup"} aria-label={q.title}>
        {opts.map((o, i) => {
          const on = chosen.includes(o.value);
          return (
            <button key={o.value} type="button" role={q.multi ? "checkbox" : "radio"} aria-checked={on} className={`gw-opt gw-up${on ? " on" : ""}${o.sub ? " tall" : ""}`} style={{ animationDelay: `${0.04 * i + 0.05}s` }} onClick={() => onPick(o.value)}>
              <span aria-hidden="true" className={`gw-key${q.multi ? " gw-key-multi" : ""}`}>{q.multi && on ? "✓" : KEYS[i]}</span>
              <span className="gw-opt-label">{o.label}{o.sub && <span className="gw-opt-sub">{o.sub}</span>}</span>
            </button>
          );
        })}
      </div>
      {otherOn && (
        <div className={`gw-other-row gw-grow${q.multi ? " gw-other-solo" : ""}`}>
          <label className="gw-other-label">Describe it
            <input className="gw-other" autoFocus value={other} onChange={(e) => onOther(e.target.value)} placeholder={q.otherHint} maxLength={280} onKeyDown={(e) => e.key === "Enter" && canGo && onNext()} />
          </label>
          {!q.multi && <button type="button" className="gw-btn gw-btn-small" disabled={!canGo} onClick={onNext}>OK ✓</button>}
        </div>
      )}
      {q.multi && (
        <>
          <div className="gw-flex" />
          <button type="button" className="gw-btn" disabled={!canGo} onClick={onNext}>OK ✓</button>
        </>
      )}
    </div>
  );
}

function summary(a: Answers) {
  const one = (step: number, v?: string) => (v === "other" ? a.other[CHOICES[step]!.field] || "Other" : CHOICES[step]!.opts.find((o) => o.value === v)?.label ?? "Not answered");
  const label = (step: number, v?: string | string[]) => (Array.isArray(v) ? (v.length ? v.map((x) => one(step, x)).join("; ") : "Not answered") : one(step, v));
  const lean = (k: (typeof SCALES)[number]) => (a.leans[k.key] === 3 ? "Balanced" : a.leans[k.key] < 3 ? k.left : k.right.replace(", even if slower", "").replace(" as you learn", ""));
  const limits = [...a.limits.map((l) => LIMIT_OPTS.find((o) => o.value === l)!.label.toLowerCase()), ...(a.limitsOther && a.other.limits ? [a.other.limits] : [])];
  return [
    { step: 1, label: "What you do", value: clip(a.purpose || "Not answered", 90) },
    { step: 2, label: "People doing the work", value: label(2, a.scale) },
    { step: 3, label: "Who benefits", value: label(3, a.reach) },
    { step: 4, label: "Decisions today", value: label(4, a.decision) },
    { step: 5, label: "Leanings", value: SCALES.map(lean).join(" · ") },
    { step: 6, label: "Ruled out", value: limits.join(", ") || "Nothing" },
    { step: 7, label: "Setup", value: label(7, a.setup) },
    { step: 8, label: "Legal form", value: label(8, a.legal) },
    { step: 9, label: "Question", value: clip(a.question || "Not answered", 90) },
  ];
}
