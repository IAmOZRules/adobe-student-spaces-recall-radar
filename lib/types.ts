import type { Answer } from "./stats";

export type ScreenId = "start" | "quiz" | "results" | "heatmap";

export interface QuizSession {
  order: number[]; // indices into QUESTIONS, 10 picked for this round
  index: number; // position within `order`
  answers: Answer[];
  currentOptionOrder: number[]; // shuffled option indices for the current question
  currentCorrectPos: number; // position of the correct option within currentOptionOrder
  locked: boolean;
  selectedPos: number | null;
  hasShared: boolean;
}
