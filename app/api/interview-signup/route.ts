import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { isValidEmail } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { email, sharedLink } = (body as { email?: unknown; sharedLink?: unknown }) ?? {};

  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "A valid email is required" }, { status: 400 });
  }

  const shared = sharedLink === true;

  try {
    const sql = getSql();
    // completed_quiz is always true server-side: this endpoint is only
    // reachable from the post-quiz results screen. Deliberately no FK or
    // shared identifier linking this table back to concept_stats/quiz
    // answers — that separation is a privacy promise made in the product
    // copy and has to hold at the schema level, not just in the UI text.
    await sql`
      INSERT INTO interview_signups (email, completed_quiz, shared_link)
      VALUES (${email}, TRUE, ${shared})
    `;
    await sql`UPDATE funnel SET interview_signups = interview_signups + 1 WHERE id = 1`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("interview-signup failed:", err);
    return NextResponse.json({ ok: false, error: "Could not save signup" }, { status: 500 });
  }
}
