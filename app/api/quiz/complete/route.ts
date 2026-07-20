import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { sanitizeConceptStats } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const stats = sanitizeConceptStats((body as { concepts?: unknown } | null)?.concepts);
  if (!stats) {
    return NextResponse.json({ ok: false, error: "Invalid concept stats" }, { status: 400 });
  }

  try {
    const sql = getSql();
    // Atomic upsert per concept — never a read-modify-write, so concurrent
    // submissions from different students can't clobber each other's counts.
    for (const [conceptId, s] of Object.entries(stats)) {
      if (s.total === 0) continue;
      await sql`
        INSERT INTO concept_stats (concept_id, correct, total)
        VALUES (${conceptId}, ${s.correct}, ${s.total})
        ON CONFLICT (concept_id)
        DO UPDATE SET
          correct = concept_stats.correct + EXCLUDED.correct,
          total = concept_stats.total + EXCLUDED.total
      `;
    }
    await sql`UPDATE funnel SET completed = completed + 1 WHERE id = 1`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("quiz/complete failed:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
