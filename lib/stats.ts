import { CONCEPTS } from "./questions";

export interface Answer {
  concept: string;
  correct: boolean;
}

export type ConceptStatsMap = Record<string, { correct: number; total: number }>;

export function computeStats(answers: Answer[]): ConceptStatsMap {
  const stats: ConceptStatsMap = {};
  CONCEPTS.forEach((c) => (stats[c.id] = { correct: 0, total: 0 }));
  answers.forEach((a) => {
    stats[a.concept].total++;
    if (a.correct) stats[a.concept].correct++;
  });
  return stats;
}
