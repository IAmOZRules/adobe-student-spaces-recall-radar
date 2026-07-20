import { CONCEPTS } from "./questions";
import type { ConceptStats } from "./gemini";

const CONCEPT_IDS = new Set(CONCEPTS.map((c) => c.id));
const MAX_QUESTIONS_PER_SESSION = 10;

// Defends the shared aggregate stats from a malformed/malicious payload —
// caps values to what one quiz session could legitimately produce.
export function sanitizeConceptStats(input: unknown): ConceptStats | null {
  if (!input || typeof input !== "object") return null;
  const out: ConceptStats = {};
  let totalAcrossConcepts = 0;

  for (const [id, value] of Object.entries(input as Record<string, unknown>)) {
    if (!CONCEPT_IDS.has(id)) continue;
    if (!value || typeof value !== "object") continue;
    const { correct, total } = value as { correct?: unknown; total?: unknown };
    if (typeof correct !== "number" || typeof total !== "number") continue;
    if (!Number.isInteger(correct) || !Number.isInteger(total)) continue;
    if (correct < 0 || total < 0 || correct > total) continue;
    if (total > MAX_QUESTIONS_PER_SESSION) continue;

    totalAcrossConcepts += total;
    if (totalAcrossConcepts > MAX_QUESTIONS_PER_SESSION) return null;

    out[id] = { correct, total };
  }

  return out;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: unknown): email is string {
  return typeof email === "string" && email.length <= 320 && EMAIL_RE.test(email);
}
