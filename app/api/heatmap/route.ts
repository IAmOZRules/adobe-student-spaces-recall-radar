import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { CONCEPTS } from "@/lib/questions";

export const dynamic = "force-dynamic";

// Public, aggregate-only endpoint — concept-level percentages and coarse
// funnel counts, never anything that could identify an individual student.
export async function GET() {
  try {
    const sql = getSql();
    const [conceptRows, funnelRows] = await Promise.all([
      sql`SELECT concept_id, correct, total FROM concept_stats`,
      sql`SELECT started, completed, shared FROM funnel WHERE id = 1`,
    ]);

    const byId = new Map(
      (conceptRows as { concept_id: string; correct: number; total: number }[]).map((r) => [r.concept_id, r])
    );

    const concepts = CONCEPTS.map((c) => {
      const row = byId.get(c.id);
      const correct = row?.correct ?? 0;
      const total = row?.total ?? 0;
      return {
        id: c.id,
        label: c.label,
        correct,
        total,
        pct: total ? Math.round((correct / total) * 100) : null,
      };
    });

    const funnel = (funnelRows as { started: number; completed: number; shared: number }[])[0] ?? {
      started: 0,
      completed: 0,
      shared: 0,
    };

    return NextResponse.json({
      concepts,
      started: funnel.started,
      completed: funnel.completed,
      shared: funnel.shared,
    });
  } catch (err) {
    console.error("heatmap GET failed:", err);
    return NextResponse.json({ error: "Could not load class data" }, { status: 500 });
  }
}
