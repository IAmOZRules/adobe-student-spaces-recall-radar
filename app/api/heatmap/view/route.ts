import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const sql = getSql();
    await sql`UPDATE funnel SET heatmap_views = heatmap_views + 1 WHERE id = 1`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("heatmap/view failed:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
