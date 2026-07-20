"use client";

import { useEffect, useState } from "react";

interface ConceptTile {
  id: string;
  label: string;
  correct: number;
  total: number;
  pct: number | null;
}

interface HeatmapData {
  concepts: ConceptTile[];
  started: number;
  completed: number;
  shared: number;
}

function tileColors(pct: number | null): { bg: string; fg: string } {
  if (pct === null) return { bg: "var(--paper)", fg: "var(--ink-faint)" };
  if (pct < 45) return { bg: "var(--red-tint-2)", fg: "var(--red-deep)" };
  if (pct < 70) return { bg: "#FBEFD9", fg: "#8A5A00" };
  return { bg: "var(--strong-tint)", fg: "var(--strong)" };
}

export default function HeatmapScreen({ onHome }: { onHome: () => void }) {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/heatmap/view", { method: "POST" }).catch(() => {});

    let cancelled = false;
    fetch("/api/heatmap")
      .then((r) => {
        if (!r.ok) throw new Error(`status ${r.status}`);
        return r.json();
      })
      .then((json: HeatmapData) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const unfinished = data ? Math.max(0, data.started - data.completed) : 0;

  return (
    <section className="screen active">
      <div className="card">
        <div className="eyebrow">Class heatmap</div>
        <h1 className="hero" style={{ fontSize: "26px" }}>
          Where the whole class is weak.
        </h1>
        <div className="shared-note">
          <span>📡</span>
          <span>
            This view is <b>shared and live</b> — it aggregates results from everyone who opens this link and takes
            the quiz. Only concept-level percentages are shown; no individual&apos;s answers or identity are ever
            visible here.
          </span>
        </div>

        {error && <div className="empty-state">Couldn&apos;t load class data right now — try again in a moment.</div>}

        {!error && !data && (
          <div className="loading-row">
            <div className="spinner" /> Loading class data…
          </div>
        )}

        {!error && data && (
          <>
            <div className="stat-strip">
              {[
                { label: "Started", n: data.started },
                { label: "Completed", n: data.completed },
                { label: "Started, didn't finish", n: unfinished },
                { label: "Finished & shared", n: data.shared },
              ].map((t) => (
                <div className="stat-tile" key={t.label}>
                  <div className="s-num">{t.n}</div>
                  <div className="s-label">{t.label}</div>
                </div>
              ))}
            </div>

            {!data.started && !data.completed && (
              <div className="empty-state">No one has taken the quiz yet — be the first, then check back here.</div>
            )}

            {data.started > 0 && data.completed === 0 && (
              <div className="empty-state">Someone&apos;s started, but no one&apos;s finished a round yet — check back soon.</div>
            )}

            {data.completed > 0 && (
              <>
                <div className="heatmap-grid">
                  {data.concepts.map((c) => {
                    const { bg, fg } = tileColors(c.pct);
                    return (
                      <div className="heat-tile" style={{ background: bg }} key={c.id}>
                        <div className="h-label" style={{ color: fg }}>
                          {c.label}
                        </div>
                        <div className="h-pct" style={{ color: fg }}>
                          {c.pct === null ? "—" : `${c.pct}%`}
                        </div>
                        <div className="h-n" style={{ color: fg }}>
                          {c.total} answers logged
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontSize: "13px", color: "var(--ink-soft)", marginTop: "16px" }}>
                  Based on {data.completed} completed quiz session{data.completed === 1 ? "" : "s"} so far.
                </p>
              </>
            )}
          </>
        )}

        <div className="results-actions">
          <button className="btn-ghost" onClick={onHome}>
            Back to start
          </button>
        </div>
      </div>
    </section>
  );
}
