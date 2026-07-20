import { NextResponse } from "next/server";
import { fetchAIRead, localFallback } from "@/lib/gemini";
import { sanitizeConceptStats } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ text: "Couldn't read your results — check the legend above instead." }, { status: 200 });
  }

  const stats = sanitizeConceptStats((body as { stats?: unknown } | null)?.stats);
  if (!stats) {
    return NextResponse.json({ text: "Couldn't read your results — check the legend above instead." }, { status: 200 });
  }

  try {
    const { text, source } = await fetchAIRead(stats);
    return NextResponse.json({ text, source });
  } catch (err) {
    // fetchAIRead already catches its own errors, but this is a last-resort
    // guard so the UI never gets stuck on a broken/stalled state.
    console.error("ai-read route failed unexpectedly:", err);
    return NextResponse.json({ text: localFallback(stats), source: "fallback" });
  }
}
