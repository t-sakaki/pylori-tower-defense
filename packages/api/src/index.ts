import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { DrugLog, DrugStatus, DrugSlot } from '@pylori/shared';

// Cloudflare Workers bindings
type Bindings = {
  PYLORI_KV: KVNamespace;
  // PYLORI_DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS: Vercel and local dev
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-vercel-app.vercel.app'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

// Root endpoint
app.get('/', (c) => c.json({ message: 'Pylori API is running', endpoints: ['/health', '/api/drug/*', '/api/score', '/api/leaderboard'] }));

// Health check
app.get('/health', (c) => c.json({ status: 'ok', service: 'pylori-api' }));

// POST /api/drug/take — 服薬記録
app.post('/api/drug/take', async (c) => {
  const body = await c.req.json<DrugLog>();
  const { userId, day, slot, takenAt } = body;

  if (!userId || !day || !slot || !takenAt) {
    return c.json({ error: 'Missing required fields' }, 400);
  }

  const key = `drug:${userId}:day${day}:${slot}`;
  await c.env.PYLORI_KV.put(key, takenAt);

  // コンボ数計算（簡易版）
  const comboKey = `combo:${userId}`;
  const currentCombo = parseInt((await c.env.PYLORI_KV.get(comboKey)) || '0');
  const newCombo = currentCombo + 1;
  await c.env.PYLORI_KV.put(comboKey, String(newCombo));

  return c.json({
    success: true,
    day,
    slot,
    comboCount: newCombo,
  });
});

// GET /api/drug/status?userId=xxx&day=3 — 服薬状況取得
app.get('/api/drug/status', async (c) => {
  const userId = c.req.query('userId');
  const day = parseInt(c.req.query('day') || '1');

  if (!userId) {
    return c.json({ error: 'userId is required' }, 400);
  }

  const slots: DrugSlot[] = ['morning', 'noon', 'evening', 'night'];
  const status: Record<string, boolean> = {};

  for (const slot of slots) {
    const key = `drug:${userId}:day${day}:${slot}`;
    const value = await c.env.PYLORI_KV.get(key);
    status[slot] = !!value;
  }

  const comboKey = `combo:${userId}`;
  const comboCount = parseInt((await c.env.PYLORI_KV.get(comboKey)) || '0');

  return c.json({
    day,
    slots: status,
    comboCount,
  } as DrugStatus);
});

// POST /api/score — スコア保存
app.post('/api/score', async (c) => {
  const body = await c.req.json();
  const { userId, day, wave, score, cleared } = body;

  if (!userId || day == null || wave == null || score == null) {
    return c.json({ error: 'Missing required fields' }, 400);
  }

  const key = `score:${userId}:${Date.now()}`;
  const data = JSON.stringify({ userId, day, wave, score, cleared, createdAt: new Date().toISOString() });
  await c.env.PYLORI_KV.put(key, data);

  return c.json({ success: true });
});

// GET /api/leaderboard — 簡易ランキング
app.get('/api/leaderboard', async (c) => {
  // KV prefix scan (limited, for MVP only)
  const list = await c.env.PYLORI_KV.list({ prefix: 'score:' });
  const scores: { userId: string; score: number; day: number }[] = [];

  for (const key of list.keys.slice(0, 20)) {
    const value = await c.env.PYLORI_KV.get(key.name);
    if (value) {
      const data = JSON.parse(value);
      scores.push(data);
    }
  }

  scores.sort((a, b) => b.score - a.score);
  return c.json({ scores: scores.slice(0, 10) });
});

export default app;