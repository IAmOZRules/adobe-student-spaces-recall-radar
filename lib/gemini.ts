import { CONCEPTS } from "./questions";

export type ConceptStats = Record<string, { correct: number; total: number }>;

// Update this if Google renames/deprecates the model — check
// https://ai.google.dev/gemini-api/docs/models for current IDs.
const GEMINI_MODEL = "gemini-3.1-flash-lite";
const GEMINI_TIMEOUT_MS = 8000;

function buildSummary(stats: ConceptStats): string {
  return CONCEPTS.map((c) => {
    const s = stats[c.id];
    const pct = s && s.total ? Math.round((s.correct / s.total) * 100) : null;
    return `${c.label}: ${pct === null ? "not covered this round" : `${pct}% correct (${s.correct}/${s.total})`}`;
  }).join("; ");
}

function buildPrompt(stats: ConceptStats): string {
  const summary = buildSummary(stats);
  return `A student just took a 10-question quiz on an MBA "Management & Innovation Systems" course (Structure, Systems Thinking, Complexity, and Design Thinking topics). Their per-concept results: ${summary}. In 2-3 short, encouraging but direct sentences, tell them in natural language which concept(s) they should review next and why, referencing the actual concept names. Do not use markdown formatting, just plain prose.`;
}

export function localFallback(stats: ConceptStats): string {
  const weakest = CONCEPTS.map((c) => ({ c, s: stats[c.id] }))
    .filter((x) => x.s && x.s.total > 0)
    .sort((a, b) => a.s.correct / a.s.total - b.s.correct / b.s.total)[0];

  if (!weakest) {
    return "The AI advisor didn't respond this time — check the legend above for a per-concept breakdown instead.";
  }
  return `The AI advisor didn't respond, but from the numbers: ${weakest.c.label} looks like the softest spot this round (${weakest.s.correct}/${weakest.s.total} correct) — worth a re-read before the next pass.`;
}

export async function fetchAIRead(stats: ConceptStats): Promise<{ text: string; source: "gemini" | "fallback" }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { text: localFallback(stats), source: "fallback" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(stats) }] }],
          generationConfig: { maxOutputTokens: 220 },
        }),
        signal: controller.signal,
      }
    );

    if (!res.ok) {
      throw new Error(`Gemini API responded ${res.status}`);
    }

    const data = await res.json();
    const text: string = (data?.candidates?.[0]?.content?.parts ?? [])
      .map((p: { text?: string }) => p.text ?? "")
      .join(" ")
      .trim();

    if (!text) throw new Error("empty response from Gemini");
    return { text, source: "gemini" };
  } catch (err) {
    console.error("Gemini call failed, using local fallback:", err);
    return { text: localFallback(stats), source: "fallback" };
  } finally {
    clearTimeout(timeout);
  }
}
