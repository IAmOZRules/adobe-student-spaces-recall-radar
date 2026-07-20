import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sql = getSql();
    await sql`DELETE FROM concept_stats`;
    await sql`DELETE FROM interview_signups`;
    await sql`UPDATE funnel SET started = 0, completed = 0, heatmap_views = 0, shared = 0, interview_signups = 0 WHERE id = 1`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("admin/reset failed:", err);
    return NextResponse.json({ ok: false, error: "Reset failed" }, { status: 500 });
  }
}
