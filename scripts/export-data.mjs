// Dumps everything currently stored in the DB (concept_stats, funnel,
// interview_signups) to a timestamped JSON file and a human-readable
// Markdown report. Read-only — never writes to the database.
//
// Usage: node scripts/export-data.mjs [outputDir]
// Requires DATABASE_URL (loaded from .env / .env.local, same as migrate.mjs).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";
import { CONCEPTS } from "../lib/questions.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");

function loadDotEnvFile(filename) {
  const envPath = path.join(projectRoot, filename);
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadDotEnvFile(".env");
loadDotEnvFile(".env.local");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set (checked process.env, .env, and .env.local).");
  process.exit(1);
}

const outputDir = path.join(projectRoot, process.argv[2] || "exports");
fs.mkdirSync(outputDir, { recursive: true });

const sql = neon(process.env.DATABASE_URL);

function pct(part, whole) {
  return whole ? Math.round((part / whole) * 1000) / 10 : 0;
}

async function main() {
  const [conceptRows, funnelRows, signupRows] = await Promise.all([
    sql`SELECT concept_id, correct, total FROM concept_stats ORDER BY concept_id`,
    sql`SELECT started, completed, heatmap_views, shared, interview_signups FROM funnel WHERE id = 1`,
    sql`SELECT id, email, completed_quiz, shared_link, created_at FROM interview_signups ORDER BY shared_link DESC, created_at DESC`,
  ]);

  const conceptById = new Map(conceptRows.map((r) => [r.concept_id, r]));
  const concepts = CONCEPTS.map((c) => {
    const row = conceptById.get(c.id) ?? { correct: 0, total: 0 };
    return {
      id: c.id,
      label: c.label,
      correct: row.correct,
      total: row.total,
      pct: row.total ? pct(row.correct, row.total) : null,
    };
  });

  const funnel = funnelRows[0] ?? {
    started: 0,
    completed: 0,
    heatmap_views: 0,
    shared: 0,
    interview_signups: 0,
  };
  const funnelStages = [
    { label: "Started", count: funnel.started, pctOfStarted: 100 },
    { label: "Completed", count: funnel.completed, pctOfStarted: pct(funnel.completed, funnel.started) },
    { label: "Viewed the heatmap", count: funnel.heatmap_views, pctOfStarted: pct(funnel.heatmap_views, funnel.started) },
    { label: "Shared", count: funnel.shared, pctOfStarted: pct(funnel.shared, funnel.started) },
    { label: "Signed up for interview", count: funnel.interview_signups, pctOfStarted: pct(funnel.interview_signups, funnel.started) },
  ];

  const exportedAt = new Date().toISOString();
  const data = { exportedAt, concepts, funnel: funnelStages, interviewSignups: signupRows };

  const stamp = exportedAt.replace(/[:.]/g, "-");
  const jsonPath = path.join(outputDir, `recall-radar-export-${stamp}.json`);
  const mdPath = path.join(outputDir, `recall-radar-export-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
  fs.writeFileSync(mdPath, toMarkdown(data));

  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${mdPath}`);
  console.log(`\nContains ${signupRows.length} interview signup(s) with real student emails — exports/ is gitignored, keep it that way.`);
}

function toMarkdown({ exportedAt, concepts, funnel, interviewSignups }) {
  const lines = [];
  lines.push(`# Recall Radar — data export`);
  lines.push("");
  lines.push(`Exported: ${exportedAt}`);
  lines.push("");

  lines.push(`## Engagement funnel`);
  lines.push("");
  lines.push(`| Stage | Count | % of Started |`);
  lines.push(`|---|---|---|`);
  for (const s of funnel) {
    lines.push(`| ${s.label} | ${s.count} | ${s.pctOfStarted}% |`);
  }
  lines.push("");

  lines.push(`## Class heatmap (concept_stats)`);
  lines.push("");
  lines.push(`| Concept | Correct | Total | % Correct |`);
  lines.push(`|---|---|---|---|`);
  for (const c of concepts) {
    lines.push(`| ${c.label} | ${c.correct} | ${c.total} | ${c.pct === null ? "—" : `${c.pct}%`} |`);
  }
  lines.push("");

  lines.push(`## Interview signups (${interviewSignups.length})`);
  lines.push("");
  if (interviewSignups.length === 0) {
    lines.push(`_No signups yet._`);
  } else {
    lines.push(`| Email | Completed quiz | Shared link | Submitted |`);
    lines.push(`|---|---|---|---|`);
    for (const s of interviewSignups) {
      lines.push(`| ${s.email} | ${s.completed_quiz ? "Yes" : "No"} | ${s.shared_link ? "Yes" : "No"} | ${s.created_at} |`);
    }
  }
  lines.push("");

  return lines.join("\n");
}

main().catch((err) => {
  console.error("Export failed:", err);
  process.exit(1);
});
