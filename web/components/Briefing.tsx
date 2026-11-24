import type { Block, Briefing as BriefingT, CellState, Profile, ToolView } from "../../src/shared/schema";
import { leanLabel, SCALE_POLES } from "../../src/pipeline/vocab";
import { PoweredBy } from "./PoweredBy";
import "./briefing.css";

type Props = { briefing: BriefingT; profile: Profile };

const NEED_COLORS = ["var(--red)", "var(--orange)", "var(--gold)", "var(--green)", "var(--charcoal)"];
const MARK: Record<CellState, { mark: string; word: string; cls: string }> = {
  yes: { mark: "✓", word: "yes", cls: "yes" },
  conflict: { mark: "✕", word: "no", cls: "no" },
  unknown: { mark: "?", word: "unknown", cls: "unk" },
};

const longDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const monthYear = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
const get = <K extends Block["kind"]>(b: BriefingT, kind: K) => b.blocks.find((x) => x.kind === kind) as Extract<Block, { kind: K }> | undefined;
const riskLower = (t: ToolView) => t.takeoverRiskPlain.replace(" risk", "").toLowerCase();

export function Briefing({ briefing: b, profile }: Props) {
  const tools = new Map(b.tools.map((t) => [t.id, t]));
  const leanings = get(b, "leanings");
  const needs = get(b, "needs");
  const comparison = get(b, "comparison");
  const choose = get(b, "howToChoose");
  const guards = get(b, "safeguards");
  const questions = get(b, "questions");
  const setAside = get(b, "setAside");
  const legal = get(b, "legal");
  const test = get(b, "testReview");
  const kept = get(b, "fromQuestions");
  const compared = comparison ? comparison.toolIds.map((id) => tools.get(id)!).filter(Boolean) : [];
  const stale = compared.filter((t) => t.stale);
  const kind = (t: ToolView) => b.kinds[t.id] ?? t.kindPlain;
  const cell = (toolId: string, column: string) => comparison?.cells.find((c) => c.toolId === toolId && c.column === column)?.state ?? "unknown";
  const toolLabel = (ids: string[] | "all") => (ids === "all" ? `All ${compared.length}` : ids.map((id) => tools.get(id)?.name ?? id).join(", "));
  const needCols = comparison?.columns.filter((c) => c.group === "need") ?? [];
  const limitCols = comparison?.columns.filter((c) => c.group === "limit") ?? [];

  return (
    <article className="gw-brief">
      <header className="gw-up gw-brief-head">
        <p className="gw-meta">Briefing for {profile.name} · {longDate(b.snapshot)}</p>
        <h1>{b.title}</h1>
        {b.overview.map((p, i) => <p key={i} className="gw-lead">{p}</p>)}
        <p className="gw-meta">Written by AI from independently reviewed tool profiles. Facts to weigh, not recommendations.</p>
      </header>

      {leanings && (
        <section className="gw-up gw-s1" aria-labelledby="l-h">
          <h2 id="l-h">Where your group leans</h2>
          <div className="gw-grid gw-grid-3">
            {leanings.items.map((l) => (
              <div key={l.scale} className="gw-card">
                <div className="gw-scale-poles"><span>{SCALE_POLES[l.scale][0]}</span><span>{SCALE_POLES[l.scale][1]}</span></div>
                <div className="gw-scale" aria-hidden="true"><div className="gw-scale-line" /><div className="gw-scale-dot" style={{ left: `${((l.value - 1) / 4) * 100}%` }} /></div>
                <p className="gw-small"><strong>{leanLabel(l.scale, l.value)}.</strong> {l.implication}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {needs && (
        <section className="gw-up gw-s1" aria-labelledby="n-h">
          <h2 id="n-h">What the group needs</h2>
          <div className="gw-grid gw-grid-needs">
            {needs.items.map((n, i) => (
              <div key={n.affordanceId} className="gw-need" style={{ borderTopColor: NEED_COLORS[i % NEED_COLORS.length] }}>
                <span className="gw-need-text">{n.plain}</span>
                <span className="gw-need-count">{n.count ? `${n.count} ready-made ${n.count === 1 ? "option" : "options"}` : "No option confirmed yet"}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="gw-up gw-s2" aria-labelledby="o-h">
        <div className="gw-sec-head">
          <h2 id="o-h">The options</h2>
          {compared.length > 0 && <p className="gw-small">Listed alphabetically. ✓ confirmed · ✕ doesn't fit your answers · ? unknown, ask the project.</p>}
        </div>
        {compared.length === 0 && <p className="gw-small">No ready-made option meets these needs without breaking your limits. The questions and set-aside list below show what came closest.</p>}
        {compared.length > 0 && comparison && (
          <>
            <div role="table" aria-label="Options compared" className="gw-table" style={{ ["--cols" as string]: `minmax(180px, 2.2fr) repeat(${needCols.length}, minmax(0, 1fr)) repeat(${limitCols.length}, minmax(0, 0.9fr)) minmax(150px, 1.6fr)` }}>
              <div role="row" className="gw-tr gw-th">
                <span role="columnheader" className="gw-td gw-td-tool">Tool</span>
                {needCols.map((c) => <span key={c.id} role="columnheader" className="gw-td">{c.label}</span>)}
                {limitCols.map((c, i) => <span key={c.id} role="columnheader" className={`gw-td${i === 0 ? " gw-rule" : ""}`}>{c.label}</span>)}
                <span role="columnheader" className="gw-td gw-rule">Maturity · takeover risk · reviewed</span>
              </div>
              {compared.map((t) => (
                <div key={t.id} id={`opt-${t.id}`} role="row" className="gw-tr">
                  <span role="cell" className="gw-td gw-td-tool"><a href={t.url} target="_blank" rel="noreferrer" className="gw-tool-name">{t.name}</a><span className="gw-tool-kind">{kind(t)}</span></span>
                  {[...needCols, ...limitCols].map((c, i) => {
                    const m = MARK[cell(t.id, c.id)];
                    return <span key={c.id} role="cell" aria-label={`${c.label}: ${m.word}`} className={`gw-td gw-mark gw-${m.cls}${i === needCols.length ? " gw-rule" : ""}`}>{m.mark}</span>;
                  })}
                  <span role="cell" className="gw-td gw-rule gw-status">{t.maturityPlain} · {t.takeoverRiskPlain}<br /><span className="gw-muted">{monthYear(t.reviewed)}</span></span>
                </div>
              ))}
            </div>
            <div className="gw-cards">
              {compared.map((t) => (
                <article key={t.id} id={`card-${t.id}`} className="gw-card gw-tool-card">
                  <div className="gw-tool-card-head"><h3><a href={t.url} target="_blank" rel="noreferrer">{t.name}</a></h3><span className="gw-tool-kind">{kind(t)}</span></div>
                  <div className="gw-tool-card-cells">
                    {[...needCols, ...limitCols].map((c) => {
                      const m = MARK[cell(t.id, c.id)];
                      return <span key={c.id}><span aria-hidden="true" className={`gw-mark gw-${m.cls}`}>{m.mark}</span><span className="gw-vh">{m.word}: </span>{c.label}</span>;
                    })}
                  </div>
                  <span className="gw-tool-card-foot">{t.maturityPlain} · Takeover risk {riskLower(t)} · Reviewed {monthYear(t.reviewed)}</span>
                </article>
              ))}
            </div>
            {stale.length > 0 && <p className="gw-note">{stale.map((t) => `${t.name} was last reviewed in ${monthYear(t.reviewed)}`).join("; ")}; details may have changed.</p>}
          </>
        )}
        {b.notReady.length > 0 && <p className="gw-note">Not ready yet, so left out: {b.notReady.map((n) => n.name).join(", ")}.</p>}
      </section>

      {choose && (
        <section className="gw-up gw-s3" aria-labelledby="c-h">
          <h2 id="c-h">How to choose</h2>
          <div className="gw-grid gw-grid-4">
            {choose.items.map((c, i) => (
              <div key={i} className="gw-ruled"><h3>{c.title}</h3><p className="gw-small">{c.body}</p></div>
            ))}
          </div>
        </section>
      )}

      {guards && (
        <section className="gw-up gw-s3" aria-labelledby="b-h">
          <div className="gw-sec-head">
            <h2 id="b-h">Keeping it balanced</h2>
            <p className="gw-small">Each leaning has a typical way of going wrong. These are common safeguards, whichever tool you choose.</p>
          </div>
          <div className="gw-grid gw-grid-3">
            {guards.items.map((g, i) => (
              <div key={i} className="gw-ruled">
                <h3>{g.leaning}</h3>
                <p className="gw-small"><span className="gw-risk">Risk:</span> {g.risk}</p>
                <p className="gw-small"><span className="gw-guard">Safeguard:</span> {g.safeguard}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {(questions || setAside) && (
        <div className="gw-pair">
          {questions && (
            <section className="gw-up gw-s3 gw-pair-wide" aria-labelledby="q-h">
              <h2 id="q-h">Questions to ask before choosing</h2>
              {questions.items.map((q, i) => (
                <div key={i} className="gw-qrow"><span className="gw-qtool">{toolLabel(q.toolIds)}</span><span className="gw-small">{q.question}</span></div>
              ))}
            </section>
          )}
          {setAside && (
            <section className="gw-up gw-s3 gw-pair-narrow" aria-labelledby="s-h">
              <h2 id="s-h">Set aside</h2>
              {setAside.items.map((s) => (
                <div key={s.toolId} className="gw-aside-row">
                  <a href={tools.get(s.toolId)?.url} target="_blank" rel="noreferrer" className="gw-aside-name">{tools.get(s.toolId)?.name ?? s.toolId}</a>
                  <span className="gw-small">{s.reason}</span>
                </div>
              ))}
            </section>
          )}
        </div>
      )}

      <div className="gw-pair">
        {legal && (
          <section className="gw-up gw-s4 gw-pair-wide" aria-labelledby="lg-h">
            <h2 id="lg-h">Your legal setup</h2>
            {legal.paragraphs.map((p, i) => <p key={i} className="gw-small">{p}</p>)}
            {legal.related.length > 0 && (
              <div className="gw-related">
                <strong>Related ways to organize and handle money</strong>
                <ul>{legal.related.map((r) => <li key={r.id}><strong>{r.name}:</strong> {r.note}</li>)}</ul>
              </div>
            )}
          </section>
        )}
        {test && (
          <section className="gw-up gw-s4 gw-test" aria-labelledby="t-h">
            <h2 id="t-h" className="gw-eyebrow">Test it, then review</h2>
            <p>{test.steps}</p>
            <span className="gw-eyebrow">What to look at afterwards</span>
            {test.review.map((r, i) => <p key={i} className="gw-review">{r}</p>)}
            <p className="gw-test-foot">Come back with what you learned. Your next briefing starts from it.</p>
            <button type="button" className="gw-btn-light gw-noprint" onClick={() => window.print()}>Save as PDF</button>
          </section>
        )}
      </div>

      {kept && kept.items.length > 0 && (
        <section className="gw-up" aria-labelledby="fq-h">
          <h2 id="fq-h">From your questions</h2>
          <div className="gw-grid gw-grid-kept">
            {kept.items.map((k) => (
              <div key={k.at} className="gw-ruled">
                <h3>{k.question}</h3>
                {k.answer.split(/\n{2,}/).map((p, i) => <p key={i} className="gw-small">{p.replace(/\*\*/g, "")}</p>)}
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="gw-brief-foot"><PoweredBy /></footer>
    </article>
  );
}
