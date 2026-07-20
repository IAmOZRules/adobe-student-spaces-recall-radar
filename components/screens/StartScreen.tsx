export default function StartScreen({
  onStart,
  onHeatmap,
}: {
  onStart: () => void;
  onHeatmap: () => void;
}) {
  return (
    <section className="screen active">
      <div className="card">
        <div className="eyebrow">Management &amp; Innovation Systems &middot; Sessions 4&ndash;6</div>
        <h1 className="hero">Find out what you don&apos;t actually know yet.</h1>
        <p className="hero-sub">
          A 10-question pull from a 30-question bank covering Structure, Systems Thinking &amp; Complexity, and
          Design Thinking. Answer, then see your personal weak-concept map — and how your answers stack up against
          everyone else who&apos;s taken it.
        </p>

        <div className="loop-diagram">
          <div className="loop-step">You take the quiz</div>
          <div className="loop-arrow">→</div>
          <div className="loop-step">See your weak spots</div>
          <div className="loop-arrow">→</div>
          <div className="loop-step">Class heatmap gets sharper</div>
        </div>

        <div className="start-actions">
          <button className="btn-primary" onClick={onStart}>
            Start quiz
          </button>
          <button className="btn-ghost" onClick={onHeatmap}>
            View class heatmap
          </button>
        </div>

        <div className="meta-row">
          <div className="meta-item">
            <b>10</b> questions this round
          </div>
          <div className="meta-item">
            <b>6</b> concepts covered
          </div>
          <div className="meta-item">
            <b>~3 min</b> to finish
          </div>
        </div>
      </div>
    </section>
  );
}
