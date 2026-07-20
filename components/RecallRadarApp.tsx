"use client";

import { useCallback, useState } from "react";
import { QUESTIONS } from "@/lib/questions";
import { shuffledIndices } from "@/lib/shuffle";
import { computeStats } from "@/lib/stats";
import type { ScreenId, QuizSession } from "@/lib/types";
import BrandMark from "./BrandMark";
import StartScreen from "./screens/StartScreen";
import QuizScreen from "./screens/QuizScreen";
import ResultsScreen from "./screens/ResultsScreen";
import HeatmapScreen from "./screens/HeatmapScreen";

function emptySession(): QuizSession {
  return {
    order: [],
    index: 0,
    answers: [],
    currentOptionOrder: [],
    currentCorrectPos: -1,
    locked: false,
    selectedPos: null,
    hasShared: false,
  };
}

function optionOrderFor(questionOrder: number[], index: number) {
  const question = QUESTIONS[questionOrder[index]];
  const order = shuffledIndices(question.options.length);
  return { order, correctPos: order.indexOf(question.correct) };
}

export default function RecallRadarApp() {
  const [screen, setScreen] = useState<ScreenId>("start");
  const [session, setSession] = useState<QuizSession>(emptySession());
  const [finishedStats, setFinishedStats] = useState<{ totalCorrect: number; totalAnswered: number } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiText, setAiText] = useState<string | null>(null);

  const goHome = useCallback(() => setScreen("start"), []);
  const goHeatmap = useCallback(() => setScreen("heatmap"), []);

  const startQuiz = useCallback(() => {
    const picked = shuffledIndices(QUESTIONS.length).slice(0, 10);
    const { order, correctPos } = optionOrderFor(picked, 0);
    setSession({
      order: picked,
      index: 0,
      answers: [],
      currentOptionOrder: order,
      currentCorrectPos: correctPos,
      locked: false,
      selectedPos: null,
      hasShared: false,
    });
    setFinishedStats(null);
    setAiText(null);
    setScreen("quiz");
    // keepalive: this must survive the user navigating away (e.g. typing /admin
    // into the URL bar) moments after clicking Start — a plain fetch gets
    // cancelled on page unload and would silently drop the increment.
    fetch("/api/quiz/start", { method: "POST", keepalive: true }).catch(() => {});
  }, []);

  const finishQuiz = useCallback((finalAnswers: QuizSession["answers"]) => {
    const stats = computeStats(finalAnswers);
    const totalCorrect = finalAnswers.filter((a) => a.correct).length;
    setFinishedStats({ totalCorrect, totalAnswered: finalAnswers.length });
    setScreen("results");

    fetch("/api/quiz/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ concepts: stats }),
      keepalive: true,
    }).catch(() => {});

    setAiLoading(true);
    fetch("/api/ai-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stats }),
    })
      .then((r) => r.json())
      .then((data: { text?: string }) => {
        setAiText(data.text ?? "Check the legend above for a per-concept breakdown.");
      })
      .catch(() => {
        setAiText("Couldn't load the AI read this time — check the legend above for a per-concept breakdown instead.");
      })
      .finally(() => setAiLoading(false));
  }, []);

  const selectAnswer = useCallback(
    (choicePos: number) => {
      setSession((prev) => {
        if (prev.locked) return prev;
        const question = QUESTIONS[prev.order[prev.index]];
        const isCorrect = choicePos === prev.currentCorrectPos;
        return {
          ...prev,
          locked: true,
          selectedPos: choicePos,
          answers: [...prev.answers, { concept: question.concept, correct: isCorrect }],
        };
      });
    },
    []
  );

  const nextQuestion = useCallback(() => {
    setSession((prev) => {
      const isLast = prev.index === prev.order.length - 1;
      if (isLast) {
        finishQuiz(prev.answers);
        return prev;
      }
      const nextIndex = prev.index + 1;
      const { order, correctPos } = optionOrderFor(prev.order, nextIndex);
      return {
        ...prev,
        index: nextIndex,
        currentOptionOrder: order,
        currentCorrectPos: correctPos,
        locked: false,
        selectedPos: null,
      };
    });
  }, [finishQuiz]);

  const markShared = useCallback(() => {
    setSession((prev) => ({ ...prev, hasShared: true }));
    fetch("/api/quiz/share", { method: "POST", keepalive: true }).catch(() => {});
  }, []);

  const currentQuestion = screen === "quiz" ? QUESTIONS[session.order[session.index]] : null;

  return (
    <div id="app">
      <div className="topbar">
        <div className="brand">
          <BrandMark />
          <div className="brand-name">
            Recall <span>Radar</span>
          </div>
        </div>
        <div className="nav-links">
          <button className="nav-link" onClick={goHome}>
            Home
          </button>
          <button className="nav-link" onClick={goHeatmap}>
            Class heatmap
          </button>
        </div>
      </div>

      {screen === "start" && <StartScreen onStart={startQuiz} onHeatmap={goHeatmap} />}

      {screen === "quiz" && currentQuestion && (
        <QuizScreen session={session} question={currentQuestion} onSelect={selectAnswer} onNext={nextQuestion} />
      )}

      {screen === "results" && finishedStats && (
        <ResultsScreen
          stats={computeStats(session.answers)}
          totalCorrect={finishedStats.totalCorrect}
          totalAnswered={finishedStats.totalAnswered}
          aiLoading={aiLoading}
          aiText={aiText}
          hasShared={session.hasShared}
          onShareComplete={markShared}
          onRetake={startQuiz}
          onHeatmap={goHeatmap}
        />
      )}

      {screen === "heatmap" && <HeatmapScreen onHome={goHome} />}
    </div>
  );
}
