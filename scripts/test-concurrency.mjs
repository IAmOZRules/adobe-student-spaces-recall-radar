// Fires concurrent requests at the funnel/concept-stats endpoints and confirms
// no lost increments — the thing that broke in the reference build's
// read-modify-write localStorage pattern. Requires the Next.js dev/prod
// server to be running (default http://localhost:3000) and DATABASE_URL to
// point at a real, migrated Neon/Postgres database.
//
// Usage: node scripts/test-concurrency.mjs [baseUrl] [concurrency]

const baseUrl = process.argv[2] || "http://localhost:3000";
const concurrency = Number(process.argv[3] || 25);

async function getFunnelStarted() {
  // /api/admin/funnel is auth-gated, so we read the public heatmap endpoint's
  // "started" count instead — same underlying column, no auth needed.
  const res = await fetch(`${baseUrl}/api/heatmap`);
  if (!res.ok) throw new Error(`GET /api/heatmap failed: ${res.status}`);
  const data = await res.json();
  return data.started;
}

async function main() {
  console.log(`Reading baseline funnel.started from ${baseUrl} ...`);
  const before = await getFunnelStarted();
  console.log(`Baseline started = ${before}`);

  console.log(`Firing ${concurrency} concurrent POST /api/quiz/start ...`);
  const results = await Promise.allSettled(
    Array.from({ length: concurrency }, () => fetch(`${baseUrl}/api/quiz/start`, { method: "POST" }))
  );
  const failures = results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok));
  if (failures.length) {
    console.error(`${failures.length}/${concurrency} requests failed at the network/HTTP level.`);
  }

  // Small delay to let Neon's HTTP driver settle any in-flight writes.
  await new Promise((r) => setTimeout(r, 500));

  const after = await getFunnelStarted();
  const delta = after - before;
  console.log(`After = ${after} (delta = ${delta}, expected = ${concurrency})`);

  if (delta === concurrency) {
    console.log("PASS: no lost increments under concurrency.");
  } else {
    console.error(`FAIL: lost ${concurrency - delta} increment(s) — read-modify-write race likely reintroduced.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Concurrency test errored:", err);
  process.exit(1);
});
