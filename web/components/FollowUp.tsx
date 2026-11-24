import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAgentChat } from "@cloudflare/think/react";
import type { UIMessage } from "ai";
import type { Briefing } from "../../src/shared/schema";
import "./followup.css";

type Agent = Parameters<typeof useAgentChat>[0]["agent"];
type Props = { agent: Agent; briefing: Briefing; legal: string; onClose: () => void; onShow: (toolId: string) => void; addAnswer: (messageId: string) => Promise<{ ok: true } | { refused: string }>; ask: (text: string) => Promise<{ ok: true } | { refused: string; resetsAt?: string }> };

const REFUSAL: Record<string, string> = {
  rate: "That's a lot of questions in a minute. Try again in a moment.",
  weekly_cap: "This demo allows 200 follow-up questions a week per browser. More are available from Monday.",
  too_long: "Questions can be up to 1,000 characters.",
  not_ready: "The briefing isn't ready yet.",
};

/** Plain-text answer rendering: paragraphs and **bold**. No HTML from the model reaches the page. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n{2,}/).map((para, i) => (
        <p key={i}>
          {para.split(/(\*\*[^*]+\*\*)/g).map((seg, j) => (seg.startsWith("**") && seg.endsWith("**") ? <strong key={j}>{seg.slice(2, -2)}</strong> : <span key={j}>{seg.replace(/\n/g, " ")}</span>))}
        </p>
      ))}
    </>
  );
}

function lookupLabel(part: UIMessage["parts"][number], names: Map<string, string>): string | null {
  const p = part as { type: string; toolName?: string; input?: Record<string, unknown> };
  const name = p.type === "dynamic-tool" ? p.toolName : p.type.startsWith("tool-") ? p.type.slice(5) : null;
  if (!name || name === "highlight") return null;
  const input = p.input ?? {};
  const id = String(input.id ?? input.toolId ?? "");
  if (id) return `Looked up ${names.get(id) ?? id}`;
  const q = input.query ?? input.q ?? input.useCase;
  if (q) return `Searched for “${String(q)}”`;
  return "Looked up OpenHaven";
}

export function FollowUp({ agent, briefing, legal, onClose, onShow, addAnswer, ask }: Props) {
  const { messages, isStreaming, isServerStreaming } = useAgentChat({ agent });
  const [text, setText] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [added, setAdded] = useState<Record<string, string>>({});
  const list = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const tools = new Map(briefing.tools.map((t) => [t.id, t.name]));
  const compared = (briefing.blocks.find((b) => b.kind === "comparison") as { toolIds: string[] } | undefined)?.toolIds ?? [];
  const busy = isStreaming || isServerStreaming || !!pending;

  const chips = [
    "What does takeover risk mean?",
    compared.length >= 2 ? `Compare ${tools.get(compared[0]!)} and ${tools.get(compared[1]!)}` : null,
    legal !== "coop" ? "Would becoming a co-op change this?" : "Would a nonprofit work better than a co-op here?",
  ].filter(Boolean) as string[];

  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" }); }, [messages.length, isStreaming, pending]);
  useEffect(() => { input.current?.focus(); const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  useEffect(() => { if (pending && messages.some((m) => m.role === "user" && m.parts.some((p) => p.type === "text" && (p as { text: string }).text === pending))) setPending(null); }, [messages, pending]);

  const send = async (q: string) => {
    const question = q.trim();
    if (!question || busy) return;
    setNotice(null);
    setPending(question);
    setText("");
    const r = await ask(question).catch((e: unknown) => ({ refused: String((e as Error)?.message ?? e) }));
    if ("refused" in r) { setPending(null); setText(question); setNotice(REFUSAL[r.refused] ?? r.refused); }
  };

  return (
    <div className="gw-fu-wrap gw-noprint">
      <div className="gw-fu-scrim" onClick={onClose} aria-hidden="true" />
      <section className="gw-fu" role="dialog" aria-modal="true" aria-labelledby="fu-h">
        <div className="gw-fu-handle" aria-hidden="true" />
        <div className="gw-fu-head">
          <div><h2 id="fu-h">Ask about your briefing</h2><span>Knows your answers and this briefing. Can look up more tools.</span></div>
          <button type="button" className="gw-fu-close" aria-label="Close" onClick={onClose}>
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div className="gw-fu-list" ref={list} aria-live="polite">
          {messages.length === 0 && !pending && <p className="gw-fu-empty">Ask anything about the options, the trade-offs or your legal setup. Answers say what is known, when it was reviewed, and what is still unknown.</p>}
          {messages.map((m) => {
            if (m.role === "user") {
              const t = m.parts.filter((p) => p.type === "text").map((p) => (p as { text: string }).text).join(" ");
              return <div key={m.id} className="gw-fu-q">{t}</div>;
            }
            const lookups = m.parts.map((p) => lookupLabel(p, tools)).filter(Boolean) as string[];
            const answer = m.parts.filter((p) => p.type === "text").map((p) => (p as { text: string }).text).join("\n\n").trim();
            const mentioned = compared.filter((id) => answer.includes(tools.get(id) ?? "\u0000"));
            return (
              <div key={m.id} className="gw-fu-a">
                {lookups.length > 0 && <div className="gw-fu-chips">{[...new Set(lookups)].map((l) => <span key={l} className="gw-fu-chip">{l}</span>)}</div>}
                {answer && <div className="gw-fu-text"><Rich text={answer} /></div>}
                {answer && !(isStreaming && m === messages[messages.length - 1]) && (
                  <div className="gw-fu-actions">
                    <button type="button" disabled={!!added[m.id]} onClick={async () => { const r = await addAnswer(m.id); setAdded((x) => ({ ...x, [m.id]: "ok" in r ? "Added to briefing" : r.refused })); }}>{added[m.id] ?? "Add to briefing"}</button>
                    {mentioned.slice(0, 1).map((id) => <button key={id} type="button" onClick={() => onShow(id)}>Show {tools.get(id)} in the comparison</button>)}
                  </div>
                )}
              </div>
            );
          })}
          {pending && <div className="gw-fu-q">{pending}</div>}
          {busy && <div className="gw-fu-working"><span className="gw-fu-dot">●</span><span className="gw-fu-dot d2">●</span><span className="gw-fu-dot d3">●</span><span>Looking that up</span></div>}
        </div>
        <div className="gw-fu-foot">
          {notice && <p className="gw-fu-notice" role="status">{notice}</p>}
          <div className="gw-fu-suggest">{chips.map((c) => <button key={c} type="button" disabled={busy} onClick={() => send(c)}>{c}</button>)}</div>
          <form className="gw-fu-form" onSubmit={(e) => { e.preventDefault(); send(text); }}>
            <label><span className="gw-vh">Your question</span><input ref={input} className="gw-fu-field" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask about this briefing" maxLength={1000} /></label>
            <button type="submit" className="gw-fu-send" aria-label="Send" disabled={busy || !text.trim()}>
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

export function AskButton({ onClick, children }: { onClick: () => void; children?: ReactNode }) {
  return (
    <div className="gw-fab gw-noprint">
      <button type="button" onClick={onClick}>
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></svg>
        {children ?? "Ask a follow-up question"}
      </button>
    </div>
  );
}
