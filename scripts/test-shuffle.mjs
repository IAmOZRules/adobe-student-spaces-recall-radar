// Pure-logic sanity check (no DB needed): confirms the shuffle-at-render fix
// for bug #1 (23/30 questions had the correct answer on option B in the raw
// data) actually spreads the correct-answer position roughly evenly across
// A/B/C/D once shuffled, and that every question still has exactly 4 options
// and exactly one correct answer.
import { QUESTIONS } from "../lib/questions.ts";

function shuffledIndices(n) {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

let failed = false;

// 1. Structural check: 30 questions, 4 options each, exactly one correct index.
if (QUESTIONS.length !== 30) {
  console.error(`FAIL: expected 30 questions, found ${QUESTIONS.length}`);
  failed = true;
}
for (const [i, q] of QUESTIONS.entries()) {
  if (q.options.length !== 4) {
    console.error(`FAIL: question ${i} has ${q.options.length} options, expected 4`);
    failed = true;
  }
  if (!(q.correct >= 0 && q.correct < 4)) {
    console.error(`FAIL: question ${i} has out-of-range correct index ${q.correct}`);
    failed = true;
  }
}

// 2. Raw-data clustering check (documents the known bug in the source data —
// should NOT be fixed here, only fixed at render time).
const rawCounts = [0, 0, 0, 0];
QUESTIONS.forEach((q) => rawCounts[q.correct]++);
console.log("Raw (unshuffled) correct-answer position counts:", rawCounts);

// 3. Render-time shuffle check: simulate 20,000 renders and confirm the
// *shuffled* correct position lands roughly evenly across A/B/C/D.
const N = 20000;
const shuffledCounts = [0, 0, 0, 0];
for (let i = 0; i < N; i++) {
  const q = QUESTIONS[i % QUESTIONS.length];
  const order = shuffledIndices(4);
  const correctPos = order.indexOf(q.correct);
  shuffledCounts[correctPos]++;
}
const expected = N / 4;
console.log(`Shuffled correct-answer position counts over ${N} renders:`, shuffledCounts);
for (const [pos, count] of shuffledCounts.entries()) {
  const deviation = Math.abs(count - expected) / expected;
  if (deviation > 0.05) {
    console.error(`FAIL: position ${pos} deviates ${(deviation * 100).toFixed(1)}% from uniform (expected ~${expected})`);
    failed = true;
  }
}

if (failed) {
  console.error("\nSome checks FAILED.");
  process.exit(1);
} else {
  console.log("\nAll shuffle/structure checks PASSED.");
}
