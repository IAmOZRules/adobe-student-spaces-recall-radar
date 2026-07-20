import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sql = getSql();
    const rows = await sql`SELECT started, completed, heatmap_views, shared, interview_signups FROM funnel WHERE id = 1`;
    const row = (rows as {
      started: number;
      completed: number;
      heatmap_views: number;
      shared: number;
      interview_signups: number;
    }[])[0] ?? { started: 0, completed: 0, heatmap_views: 0, shared: 0, interview_signups: 0 };

    const pct = (n: number) => (row.started ? Math.round((n / row.started) * 1000) / 10 : 0);
    const abandoned = Math.max(0, row.started - row.completed);

    return NextResponse.json({
      stages: [
        { label: "Started", count: row.started, pct: 100 },
        { label: "Completed", count: row.completed, pct: pct(row.completed) },
        { label: "Started, didn't finish", count: abandoned, pct: pct(abandoned) },
        { label: "Viewed the heatmap", count: row.heatmap_views, pct: pct(row.heatmap_views) },
        { label: "Shared", count: row.shared, pct: pct(row.shared) },
        { label: "Signed up for interview", count: row.interview_signups, pct: pct(row.interview_signups) },
      ],
    });
  } catch (err) {
    console.error("admin/funnel failed:", err);
    return NextResponse.json({ error: "Could not load funnel" }, { status: 500 });
  }
}
