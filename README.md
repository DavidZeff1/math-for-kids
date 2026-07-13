# מפלצות המתמטיקה 👾 (Math Monsters)

An interactive Hebrew (RTL) math guide for kids — fractions, decimals, negatives,
order of operations, algebra, inequalities, word problems — with quizzes, interactive
generators, and a **public leaderboard** backed by Upstash Redis.

## Structure

- `index.html` — the entire front-end (HTML + CSS + JS, no build step).
- `api/leaderboard.js` — Vercel serverless function for the leaderboard.
- `package.json` — declares the `@upstash/redis` dependency so Vercel installs it.

## Leaderboard setup (Upstash Redis on Vercel)

The leaderboard reads/writes a Redis **sorted set** named `leaderboard`
(member = player name, score = stars). It keeps each player's *best* score.

1. In your Vercel project: **Storage → Marketplace → Upstash Redis** (or add the
   Upstash integration) and connect a database to this project.
2. That automatically injects the required env vars. The API accepts either naming:
   - `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (Upstash default), or
   - `KV_REST_API_URL` + `KV_REST_API_TOKEN` (Vercel KV naming).
3. Redeploy. That's it — the "לוח התוצאות" (Leaderboard) tab will start working.

### API

- `GET /api/leaderboard` → `{ "leaders": [{ "name": "...", "score": 42 }, ...] }` (top 10)
- `POST /api/leaderboard` with `{ "name": "...", "score": 42 }` → stores the best
  score for that name and returns the updated top 10.

## Local notes

Opening `index.html` directly (file://) works for everything **except** the
leaderboard, which needs the serverless API — that only runs on Vercel (or
`vercel dev` with the env vars set locally).
