// Serverless API for the public leaderboard, backed by Upstash Redis.
// GET  /api/leaderboard        -> { leaders: [{ name, score }, ...] }  (top 10)
// POST /api/leaderboard {name, score} -> stores the player's BEST score and returns the top 10.
//
// Env vars (the Upstash integration on Vercel sets these automatically):
//   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN   (preferred)
//   or KV_REST_API_URL / KV_REST_API_TOKEN              (Vercel KV naming)

const { Redis } = require('@upstash/redis');

const KEY = 'leaderboard';
const TOP_N = 10;

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

async function topList(redis) {
  // Upstash returns a flat array: [member, score, member, score, ...]
  const raw = await redis.zrange(KEY, 0, TOP_N - 1, { rev: true, withScores: true });
  const list = [];
  for (let i = 0; i < raw.length; i += 2) {
    list.push({ name: String(raw[i]), score: Number(raw[i + 1]) });
  }
  return list;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const redis = getRedis();
  if (!redis) {
    res.status(500).json({ error: 'Redis env vars are not set (UPSTASH_REDIS_REST_URL / _TOKEN).' });
    return;
  }

  try {
    if (req.method === 'GET') {
      res.status(200).json({ leaders: await topList(redis) });
      return;
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { body = {}; }
      }
      body = body || {};

      let name = (body.name != null ? String(body.name) : '').trim().slice(0, 20);
      if (!name) name = 'מפלצת אלמונית';

      let score = Math.floor(Number(body.score));
      if (!Number.isFinite(score)) score = 0;
      score = Math.max(0, Math.min(100000, score));

      // GT keeps only the player's best score (new members are still added).
      await redis.zadd(KEY, { gt: true }, { score, member: name });

      res.status(200).json({ ok: true, leaders: await topList(redis) });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};
