const express = require('express');

const app = express();
app.use(express.json());

const FAILURE_WINDOW = Number.parseInt(process.env.FAILURE_WINDOW || '300', 10);
const FAILURE_THRESHOLD = Number.parseInt(process.env.FAILURE_THRESHOLD || '5', 10);
const BAN_TIME = Number.parseInt(process.env.BAN_TIME || '600', 10);
const HOST = process.env.FAIL2BAN_HOST || '127.0.0.1';
const PORT = Number.parseInt(process.env.FAIL2BAN_PORT || '5000', 10);

// In-memory state: ip -> { fails: number[], bannedUntil: number }
const attempts = new Map();

function now() {
  return Math.floor(Date.now() / 1000);
}

function normalizeIp(ip) {
  if (!ip) return ip;
  const value = String(ip).trim();
  if (value === '::1') return '127.0.0.1';
  if (value.startsWith('::ffff:')) return value.split(':').pop();
  return value;
}

function getClientIp(req) {
  const queryIp = req.query && req.query.ip;
  const bodyIp = req.body && req.body.ip;
  const raw = queryIp || bodyIp || req.socket.remoteAddress || req.ip || '';
  return normalizeIp(raw);
}

function getEntry(ip) {
  const key = normalizeIp(ip);
  if (!attempts.has(key)) {
    attempts.set(key, { fails: [], bannedUntil: 0 });
  }
  return attempts.get(key);
}

function pruneEntry(entry, currentTs) {
  if (entry.bannedUntil && entry.bannedUntil <= currentTs) {
    entry.bannedUntil = 0;
    entry.fails = [];
  }
  entry.fails = entry.fails.filter((ts) => ts >= currentTs - FAILURE_WINDOW);
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/check', (req, res) => {
  const currentTs = now();
  const ip = getClientIp(req);
  const entry = getEntry(ip);

  pruneEntry(entry, currentTs);

  const banned = entry.bannedUntil > currentTs;
  const remaining = banned ? Math.max(0, entry.bannedUntil - currentTs) : 0;

  res.json({
    banned,
    remaining,
    fails_count: entry.fails.length,
  });
});

app.post('/attempt', (req, res) => {
  const currentTs = now();
  const ip = getClientIp(req);
  const success = Boolean(req.body && req.body.success);
  const entry = getEntry(ip);

  pruneEntry(entry, currentTs);

  if (success) {
    entry.fails = [];
    entry.bannedUntil = 0;
    return res.json({ ok: true, banned: false });
  }

  entry.fails.push(currentTs);

  if (entry.fails.length >= FAILURE_THRESHOLD) {
    entry.bannedUntil = currentTs + BAN_TIME;
    return res.json({ ok: true, banned: true, remaining: BAN_TIME });
  }

  return res.json({ ok: true, banned: false, fails: entry.fails.length });
});

app.get('/status', (_req, res) => {
  const currentTs = now();
  const summary = {};

  for (const [ip, entry] of attempts.entries()) {
    pruneEntry(entry, currentTs);

    const banned = entry.bannedUntil > currentTs;
    summary[ip] = {
      fails: entry.fails.length,
      banned,
      remaining: banned ? Math.max(0, entry.bannedUntil - currentTs) : 0,
    };
  }

  res.json(summary);
});

app.listen(PORT, HOST, () => {
  console.log(`Fail2Ban Node service running on http://${HOST}:${PORT}`);
  console.log(
    `Configuration: FAILURE_WINDOW=${FAILURE_WINDOW}s, THRESHOLD=${FAILURE_THRESHOLD}, BAN_TIME=${BAN_TIME}s`
  );
});
