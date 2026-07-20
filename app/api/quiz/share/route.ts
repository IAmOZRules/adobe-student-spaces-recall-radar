import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export const dynamic = "force-dynamic";

// Fired only after a real, user-completed share/copy action — never automatically.
export async function POST() {
  try {
    const sql = getSql();
    await sql`UPDATE funnel SET shared = shared + 1 WHERE id = 1`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("quiz/share failed:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
