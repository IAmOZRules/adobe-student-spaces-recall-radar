# Master prompt: Rebuild Recall Radar as Next.js + Neon + Gemini

Paste everything below to Claude Code as your starting instruction. It has full context baked in so it can work with minimal back-and-forth.

---

## What this is

"Recall Radar" is a spaced-repetition, weak-concept-mapping quiz app, built as a demo for the **Adobe Sprint '26 product management case competition**. It's pitched as an add-on feature living inside Adobe Student Spaces. Core loop: a student takes a quiz on their course material → sees a personal "weak concept map" → if enough classmates take the same quiz, a class-wide heatmap of where the whole cohort is weak emerges. The product thesis is explicitly peer-driven: one person's use makes the tool more useful for everyone else in their class.

A working reference implementation already exists: **`recall-radar.html`**, a single self-contained HTML/CSS/JS file originally built to run inside Claude.ai's artifact environment. It is fully functional, has been tested, and several real bugs in it have already been found and fixed. **Your job is to port this to a proper Next.js + Vercel + Neon + Gemini stack — not to redesign it or regenerate its content from scratch.**

## Reference file: what to preserve exactly, unchanged

Open `recall-radar.html` and extract these verbatim:

1. **The 30-question bank** (the `QUESTIONS` array) — 30 original, non-copyrighted multiple-choice questions across 6 concepts (5 questions each), grounded in Sessions 4–6 of a Management & Innovation Systems MBA course (Structure fundamentals, Stage-Gate/NPD, Lean Startup, Systems Thinking, Complexity & Causal Loops, Design Thinking). This has already been validated for balanced concept coverage. Do not regenerate or rewrite these questions.
2. **The 6 concept definitions** (the `CONCEPTS` array) — ids and display labels.
3. **The visual design language**: Adobe-inspired red (`#EB1000` primary, `#A30D00` hover), a teal/green secondary accent (`#0F766E`) used for the interview action and "strong" indicators, card-based layout on an off-white background, Source Sans (Adobe's actual open-source typeface — a deliberate real connection to Adobe's brand, not a knockoff of their logo/wordmark, which must never be reproduced), and a custom radar/pulse SVG mark tied literally to the "Recall Radar" name.
4. **All copy/microcopy**: the privacy reassurances, the Adobe Sprint '26 mentions, the thank-you moments at each stage of interaction (completing the quiz, sharing, signing up for interview) — these were deliberately written in and matter for the product narrative.

## Tech stack

- **Next.js** (App Router), deployed on **Vercel**.
- **Database: Neon Postgres**, via the `@neondatabase/serverless` driver. **Do not use `@vercel/postgres`** — Vercel Postgres was fully discontinued in June 2025 and that package is no longer maintained. Install the Neon integration from the Vercel Marketplace, which wires `DATABASE_URL` automatically.
- **AI: Google Gemini API**, not Anthropic — this project has free Gemini access and the AI feature is genuinely lightweight (a 2–3 sentence natural-language read of quiz results), so a fast/cheap model is the right call. Default to **`gemini-2.5-flash-lite`**; `gemini-3.5-flash` is a fine upgrade if the prose quality isn't good enough. **Verify the current model ID is still valid before hardcoding it** — Google deprecates and renames Gemini models frequently, faster than this prompt will stay current.
- Call Gemini from a **server-side Next.js API route only** (e.g. `/api/ai-read`), using `GEMINI_API_KEY` as a server environment variable. Never expose it client-side.
- Keep the frontend simple — plain CSS or Tailwind, matching the existing design tokens above. No component library needed; this app has no complexity that justifies one.

## Environment variables needed

- `DATABASE_URL` — from the Neon/Vercel integration
- `GEMINI_API_KEY`
- `ADMIN_PASSWORD` — for gating admin-only views (see below)

## Database schema (Postgres)

```sql
CREATE TABLE concept_stats (
  concept_id TEXT PRIMARY KEY,
  correct INT NOT NULL DEFAULT 0,
  total INT NOT NULL DEFAULT 0
);

CREATE TABLE funnel (
  id INT PRIMARY KEY DEFAULT 1,
  started INT NOT NULL DEFAULT 0,
  completed INT NOT NULL DEFAULT 0,
  heatmap_views INT NOT NULL DEFAULT 0,
  shared INT NOT NULL DEFAULT 0,
  interview_signups INT NOT NULL DEFAULT 0
);
INSERT INTO funnel (id) VALUES (1);

CREATE TABLE interview_signups (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  completed_quiz BOOLEAN NOT NULL DEFAULT TRUE,
  shared_link BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Keep `interview_signups` structurally unlinked from `concept_stats`** — no foreign key, no shared session/user id, nothing that lets a query join a specific email back to specific quiz answers. This preserves the existing privacy promise in the copy ("separate from your anonymous quiz answers") — that promise has to stay true at the schema level, not just in the UI text.

Increment counters with real atomic SQL (`UPDATE funnel SET started = started + 1 WHERE id = 1`), not a read-then-write pattern. See "bugs already found" below for why this matters.

## Feature spec (port from the reference file)

- **Quiz flow**: pick 10 of the 30 questions at random per session, randomize their order, one-question-at-a-time UI with immediate right/wrong feedback.
- **Personal weak-concept map**: SVG radar chart (6 axes, one per concept) computed client-side from that session's answers — no backend needed for this part.
- **Live AI read**: after finishing, POST the per-concept results to `/api/ai-read`, which calls Gemini server-side and returns a short natural-language read of weak spots. Must fail gracefully (a locally-computed fallback sentence, e.g. "X looks like your softest spot this round") if the API call errors or times out — never leave the user looking at a broken/stuck state.
- **Class heatmap**: aggregate `concept_stats` across everyone, shown as colored tiles (red = weak, teal = strong), anonymized — concept-level only, no individual identifiable data.
- **Engagement funnel** (admin-only, see below): Started → Completed → Viewed the heatmap → Shared → Signed up for interview, each as a count and a percentage of "Started."
- **Admin gating**: a proper password/token check (e.g. a cookie set after checking `ADMIN_PASSWORD`, or a simple `/admin` route behind Basic Auth) protecting the funnel view and a "reset all stored data" action. This replaces a hacky "click the logo 5 times" gesture from the artifact version, which existed only to work around Claude's sandboxed environment having no reliable way to show a real confirm dialog — that constraint doesn't exist here, so implement this properly with a real auth check and a real `confirm()`-style dialog before reset.
- **Share button**: native Web Share API with a clipboard-copy fallback. This should work reliably now — the reference version had to work around clipboard access being blocked by Chromium's cross-origin-iframe permissions policy (Claude artifacts run sandboxed); a normal Next.js page in its own tab doesn't have that restriction. Still keep a simple manual "here's the link, copy it" fallback for older/unusual browsers, but it shouldn't need to be the primary path.
- **Interview signup**: **decided — database-backed, not `mailto:`.** Replace the reference version's `mailto:` link with a small inline form (email input + "I'm open to an interview" submit button) inside the same card, keeping the exact existing copy (Adobe Sprint '26 context, the privacy line that this is separate from anonymous quiz answers, totally optional framing). On submit, POST `{ email, sharedLink }` to `/api/interview-signup`; `sharedLink` comes from the real client-side session state (was this browser's `hasShared` flag true at submit time?), not anything the student typed — that's a data-quality upgrade over the old mailto version, which trusted an editable pre-filled email body. `completed_quiz` is always `true` server-side, since this form is only reachable from the post-quiz results screen. On success, show the same in-app "Thank you!" confirmation used elsewhere — no dependency on a mail client opening. The admin view should show this table as a sortable list (email, completed, shared, submitted date) — showing "shared = true" rows first is a reasonable default, since that's the stronger engagement signal for picking interview candidates.
- **Privacy & tone**: preserve the existing copy's commitments — quiz answers are anonymous in the shared heatmap; the interview signup is explicitly separate; sharing and the interview signup are both opt-in, low-pressure, never auto-triggered or nagging; thank-you moments happen at each stage.

## Bugs already found and fixed in the reference build — do not reintroduce these

1. **Correct-answer clustering**: the raw question data has the correct answer on option B for 23 of 30 questions (an artifact of how the bank was authored). The fix was to shuffle each question's 4 options at *render* time, per attempt, and track which shuffled position is correct — never rely on the stored option order being random. Port this shuffle-at-render approach, don't just copy the raw option order as-is.
2. **Counter race conditions**: the original version used shared key-value storage with a read-modify-write pattern (fetch a JSON blob, mutate it, write it back), which can silently lose increments under concurrent writes from multiple students. Postgres's atomic `UPDATE ... SET x = x + 1` fixes this structurally — use it.
3. **Copyright**: all quiz questions must stay in original phrasing; never lift verbatim text from course readings. The existing 30 questions already satisfy this — preserve that if the bank is ever edited or expanded.

## Testing checklist before considering this done

- [ ] All 30 questions render with exactly 4 options and exactly one correct answer each.
- [ ] Run enough simulated quiz sessions to confirm correct-answer position lands roughly evenly across A/B/C/D, not clustered.
- [ ] Fire concurrent requests at the funnel/concept-stats endpoints and confirm no lost increments.
- [ ] Admin routes actually reject requests without valid credentials.
- [ ] Gemini call failure (bad key, timeout, rate limit) shows the local fallback text, not a broken UI.
- [ ] Share button works on mobile Safari and mobile Chrome without console errors.
- [ ] Neon's free-tier scale-to-zero cold start (first request after idle can take a few seconds) doesn't produce a visible error — add a loading state that tolerates it.
- [ ] `/api/interview-signup` rejects malformed/missing email, and confirm no query anywhere joins `interview_signups` to `concept_stats` or any per-question data.
- [ ] Admin signups list is reachable only with valid `ADMIN_PASSWORD` — try it logged out and confirm it's blocked.

## Deployment

Push to GitHub → connect the repo on Vercel → install the Neon integration from the Vercel Marketplace (wires `DATABASE_URL` automatically) → set `GEMINI_API_KEY` and `ADMIN_PASSWORD` as environment variables → deploy.

## Before proceeding, please confirm with the human on:

- Confirm the exact Gemini model ID against current availability before hardcoding it.

Otherwise, proceed autonomously — the reference HTML file is ground truth for content, design, and behavior wherever this prompt doesn't say otherwise.