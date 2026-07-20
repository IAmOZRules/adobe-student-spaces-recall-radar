import { conceptLabel, type Question } from "@/lib/questions";
import type { QuizSession } from "@/lib/types";

const LETTERS = ["A", "B", "C", "D"];

export default function QuizScreen({
  session,
  question,
  onSelect,
  onNext,
}: {
  session: QuizSession;
  question: Question;
  onSelect: (pos: number) => void;
  onNext: () => void;
}) {
  const totalQuestions = session.order.length;
  const isLast = session.index === totalQuestions - 1;
  const progressPct = (session.index / totalQuestions) * 100;

  return (
    <section className="screen active">
      <div className="card">
        <div className="progress-row">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="progress-label">
            Question {session.index + 1} of {totalQuestions}
          </div>
        </div>
        <div className="concept-tag">{conceptLabel(question.concept)}</div>
        <p className="question-text">{question.q}</p>
        <div className="options">
          {session.currentOptionOrder.map((origIdx, pos) => {
            const isCorrect = pos === session.currentCorrectPos;
            const isChosenWrong = session.locked && pos === session.selectedPos && !isCorrect;
            let cls = "option-btn";
            if (session.locked && isCorrect) cls += " correct";
            else if (isChosenWrong) cls += " incorrect";
            return (
              <button
                key={origIdx}
                type="button"
                className={cls}
                disabled={session.locked}
                onClick={() => onSelect(pos)}
              >
                <span className="option-letter">{LETTERS[pos]}</span>
                <span>{question.options[origIdx]}</span>
              </button>
            );
          })}
        </div>
        <div className="quiz-footer">
          {session.locked && (
            <button className="btn-primary" onClick={onNext}>
              {isLast ? "See results" : "Next question"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
