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
    // Shared-link signups first — the stronger engagement signal — then most recent.
    const rows = await sql`
      SELECT id, email, completed_quiz, shared_link, created_at
      FROM interview_signups
      ORDER BY shared_link DESC, created_at DESC
    `;
    return NextResponse.json({ signups: rows });
  } catch (err) {
    console.error("admin/signups failed:", err);
    return NextResponse.json({ error: "Could not load signups" }, { status: 500 });
  }
}
