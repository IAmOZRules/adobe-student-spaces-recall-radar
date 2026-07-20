# Recall Radar

A spaced-repetition, weak-concept-mapping quiz app — built as a demo for the
**Adobe Sprint '26** product management case competition, pitched as an
add-on feature inside Adobe Student Spaces. Core loop: a student takes a
quiz on their course material, sees a personal "weak concept map," and — if
enough classmates take the same quiz — a class-wide heatmap of where the
whole cohort is weak emerges.

This is a Next.js + Neon + Gemini port of a working single-file HTML
prototype (`proto/recall-radar.html` in the parent repo). The question
bank, visual design, and copy are carried over unchanged; the backend is
rebuilt on a proper stack so state is shared server-side instead of living
in one browser's local storage.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), deployed on Vercel |
| Database | Neon Postgres via `@neondatabase/serverless` (HTTP driver — **not** `pg` or `@vercel/postgres`) |
| AI | Google Gemini (`gemini-3.1-flash-lite`), called server-side only |
| Styling | Plain CSS (`app/globals.css`), no component library |

`@neondatabase/serverless`'s `neon()` function talks Neon's HTTP proxy
protocol, not the raw Postgres wire protocol — it only works against a real
Neon-hosted database (or Neon's local dev proxy), not a vanilla local
Postgres install.

## Project layout

```
app/
  page.tsx                 the quiz app (start -> quiz -> results -> heatmap)
  admin/page.tsx            password-gated admin dashboard
  api/
    quiz/start              POST  atomic funnel.started++
    quiz/complete            POST  atomic concept_stats upsert + funnel.completed++
    quiz/share               POST  atomic funnel.shared++ (fired after a real share/copy)
    heatmap                  GET   public aggregate stats for the class heatmap
    heatmap/view              POST  atomic funnel.heatmap_views++
    ai-read                  POST  calls Gemini server-side, falls back locally on any failure
    interview-signup          POST  inserts into interview_signups, atomic funnel++
    admin/login | logout      cookie-based admin session (HMAC token, not a raw password cookie)
    admin/funnel | signups    GET, admin-only
    admin/reset               POST, admin-only, wipes all stored data
components/                 RecallRadarApp + one component per screen
lib/
  questions.ts               the 30-question bank + 6 concepts (verbatim from the prototype)
  gemini.ts                  prompt building, Gemini call, local fallback text
  db.ts                      lazy Neon client
  admin-auth.ts              HMAC cookie issuing/verification off ADMIN_PASSWORD
  validate.ts                input sanitization (caps stats to one quiz's worth, email regex)
db/schema.sql                table definitions
scripts/
  migrate.mjs                 runs db/schema.sql against DATABASE_URL
  test-shuffle.mjs            pure-logic check: option-shuffle-at-render fix
  test-concurrency.mjs        fires concurrent requests, checks for lost increments
```

## Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | A Neon project's pooled connection string (console.neon.tech -> New Project -> Connection Details). No need to enable Neon Auth — that's a separate feature this app doesn't use. |
| `GEMINI_API_KEY` | https://aistudio.google.com/apikey |
| `ADMIN_PASSWORD` | Any password you choose — gates `/admin` and the funnel/signups/reset API routes |

## Running locally

```bash
npm install
npm run db:migrate     # creates tables, only needed once per DB
npm run dev            # http://localhost:3000 (or next free port)
```

Visit `/` for the app, `/admin` for the dashboard.

## Testing

```bash
node scripts/test-shuffle.mjs       # no DB needed — verifies option shuffle + question bank shape
npm run db:migrate                  # apply schema to DATABASE_URL
npm run dev                         # start the server the concurrency test hits
npm run test:concurrency            # in another terminal, once dev is running
```

`test-shuffle.mjs` documents a known bug in the raw question data (23/30
questions have the correct answer on option B) and confirms the render-time
shuffle fixes it — the correct answer position comes out uniform across
A–D. This is a data-shape quirk, not something to "fix" in `questions.ts`
itself; the shuffle is the fix.

`test-concurrency.mjs` fires N concurrent requests at `/api/quiz/start` and
diffs the `started` counter before/after — every increment must land. The
same logic (not scripted, but worth re-running by hand if you touch it)
applies to `/api/quiz/complete`'s `concept_stats` upsert, which uses
`INSERT ... ON CONFLICT DO UPDATE SET x = x + EXCLUDED.x` for the same
reason: the original prototype used a read-modify-write pattern against
shared key-value storage that silently lost increments under concurrent
writes, and every counter in this app was rebuilt around atomic single
statements instead.

Manual checks worth doing before a real demo:
- Share button on an actual mobile Safari/Chrome (no console errors)
- Admin login with a wrong password, and hitting `/api/admin/funnel` with
  no cookie — both should be rejected
- Pull `GEMINI_API_KEY` temporarily to confirm the AI-read box shows the
  local fallback sentence instead of an error or stuck spinner

## Privacy note (by design, not just copy)

`interview_signups` has no foreign key or shared identifier back to
`concept_stats` or any per-question data — the "this is separate from your
anonymous quiz answers" promise in the UI copy is enforced at the schema
level, not just stated in text.

## Deployment

1. Push this repo to GitHub.
2. Import it on Vercel.
3. Add the **Neon** integration from the Vercel Marketplace (wires
   `DATABASE_URL` automatically) — or reuse an existing Neon project by
   pasting its connection string in as an env var directly.
4. Set `GEMINI_API_KEY` and `ADMIN_PASSWORD` as Vercel project env vars.
5. Deploy, then run `npm run db:migrate` once against the production
   `DATABASE_URL` (locally, with that value in `.env`, is fine — Neon is
   reachable from anywhere).

## Known caveat

`gemini-3.1-flash-lite` (set in `lib/gemini.ts`) was confirmed working at
the time this was built, but Google renames/deprecates Gemini models
often. If AI reads start silently falling back to the local text, check
that constant against https://ai.google.dev/gemini-api/docs/models — the
app will keep working either way since the fallback is unconditional on
any Gemini error, but the read quality degrades to a generic sentence.
