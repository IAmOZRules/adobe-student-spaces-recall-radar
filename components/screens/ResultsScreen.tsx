"use client";

import { useEffect, useRef, useState } from "react";
import { CONCEPTS } from "@/lib/questions";
import type { ConceptStatsMap } from "@/lib/stats";
import RadarChart from "@/components/RadarChart";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ResultsScreen({
  stats,
  totalCorrect,
  totalAnswered,
  aiLoading,
  aiText,
  hasShared,
  onShareComplete,
  onRetake,
  onHeatmap,
}: {
  stats: ConceptStatsMap;
  totalCorrect: number;
  totalAnswered: number;
  aiLoading: boolean;
  aiText: string | null;
  hasShared: boolean;
  onShareComplete: () => void;
  onRetake: () => void;
  onHeatmap: () => void;
}) {
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const [shareFeedback, setShareFeedback] = useState("");
  const [manualLinkUrl, setManualLinkUrl] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [interviewSubmitting, setInterviewSubmitting] = useState(false);
  const [interviewSubmitted, setInterviewSubmitted] = useState(false);
  const [interviewError, setInterviewError] = useState("");

  function flashShareFeedback(msg: string) {
    setShareFeedback(msg);
    setTimeout(() => {
      if (mounted.current) setShareFeedback("");
    }, 2200);
  }

  async function shareApp() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: "Recall Radar",
      text: "Take this Structure / Systems Thinking / Design Thinking quiz — see your weak spots and how the class is doing.",
      url,
    };

    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share(shareData);
        onShareComplete();
        flashShareFeedback("Shared — thank you!");
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return; // user cancelled the share sheet — respect that, no fallback
        }
      }
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        onShareComplete();
        flashShareFeedback("Link copied");
        return;
      }
    } catch {
      // fall through to manual fallback
    }

    setManualLinkUrl(url);
    onShareComplete();
  }

  async function submitInterview(e: React.FormEvent) {
    e.preventDefault();
    setInterviewError("");
    if (!EMAIL_RE.test(email)) {
      setInterviewError("Enter a valid email address.");
      return;
    }
    setInterviewSubmitting(true);
    try {
      const res = await fetch("/api/interview-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, sharedLink: hasShared }),
      });
      if (!res.ok) throw new Error("request failed");
      setInterviewSubmitted(true);
    } catch {
      setInterviewError("Couldn't save that — mind trying again?");
    } finally {
      setInterviewSubmitting(false);
    }
  }

  return (
    <section className="screen active">
      <div className="card">
        <div className="eyebrow">Your results</div>
        <div className="score-banner">
          <div className="score-big">{totalCorrect}</div>
          <div className="score-of">of {totalAnswered} correct</div>
        </div>
        <p className="hero-sub" style={{ marginBottom: 0 }}>
          Thanks for taking the quiz! Here&apos;s where the concepts held up — and where they didn&apos;t.
        </p>

        <div className="action-boxes">
          <div className="action-box share">
            <p>
              If this helped, feel free to pass it on — more classmates taking it sharpens the class heatmap for
              everyone. Totally optional.
            </p>
            <div className="action-row">
              <button className="btn-share" onClick={shareApp}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                Share Recall Radar
              </button>
              <span className={`inline-feedback${shareFeedback ? " show" : ""}`}>{shareFeedback}</span>
            </div>
            {manualLinkUrl && (
              <div style={{ marginTop: "10px", width: "100%" }}>
                <input
                  type="text"
                  readOnly
                  value={manualLinkUrl}
                  style={{
                    width: "100%",
                    fontSize: "13px",
                    padding: "9px 10px",
                    borderRadius: "8px",
                    border: "1px solid var(--red-tint-2)",
                    background: "#fff",
                    color: "var(--ink)",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => e.currentTarget.select()}
                />
                <div style={{ fontSize: "11.5px", color: "var(--ink-soft)", marginTop: "6px" }}>
                  Tap and hold the link above, then tap <b>Copy</b> from the menu.
                </div>
              </div>
            )}
          </div>

          <div className="action-box interview">
            <p>
              Doing this for the Adobe Sprint &apos;26 case competition — a quick interview would be genuinely useful
              data. Separate from your quiz answers, and totally optional.
            </p>
            {interviewSubmitted ? (
              <span className="inline-feedback show">Thank you!</span>
            ) : (
              <form className="interview-form-row" onSubmit={submitInterview}>
                <input
                  type="email"
                  className="interview-email-input"
                  placeholder="you@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button className="btn-interview" type="submit" disabled={interviewSubmitting}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                  {interviewSubmitting ? "Sending…" : "I'm open to an interview"}
                </button>
              </form>
            )}
            {interviewError && <div className="form-error">{interviewError}</div>}
          </div>
        </div>

        <div className="section-label">Your weak-concept map</div>
        <div className="radar-wrap">
          <RadarChart stats={stats} />
        </div>
        <div className="concept-legend">
          {CONCEPTS.map((c) => {
            const s = stats[c.id];
            const pct = s.total ? Math.round((s.correct / s.total) * 100) : null;
            const color = pct === null ? "var(--ink-faint)" : pct >= 70 ? "var(--strong)" : pct >= 40 ? "#B8860B" : "var(--red)";
            return (
              <div className="legend-item" key={c.id}>
                <span className="legend-name">{c.label}</span>
                <span className="legend-pct" style={{ color }}>
                  {pct === null ? "—" : `${pct}%`}
                </span>
              </div>
            );
          })}
        </div>

        <div className="section-label">Reading your results</div>
        <div className="ai-box">
          <div className="ai-label">
            <span className="pulse-dot" /> AI read
          </div>
          {aiLoading ? (
            <div className="loading-row">
              <div className="spinner" /> Reading your weak spots…
            </div>
          ) : (
            aiText
          )}
        </div>

        <div className="results-actions">
          <button className="btn-primary" onClick={onRetake}>
            Take another round
          </button>
          <button className="btn-ghost" onClick={onHeatmap}>
            See the class heatmap
          </button>
        </div>
      </div>
    </section>
  );
}
