import axios from 'axios';

const FAIL2BAN_URL = process.env.FAIL2BAN_URL || 'http://127.0.0.1:5000';

async function checkIp(ip) {
  try {
    const resp = await axios.get(`${FAIL2BAN_URL}/check`, { params: { ip } , timeout: 2000});
    return resp.data || { banned: false };
  } catch (err) {
    // On error, treat as not banned (fail-open) but log
    console.error('Fail2Ban check error:', err && err.message);
    return { banned: false };
  }
}

function normalizeIp(ip) {
  if (!ip) return ip;
  ip = String(ip).trim();
  if (ip === '::1') return '127.0.0.1';
  if (ip.startsWith('::ffff:')) return ip.split(':').pop();
  return ip;
}

export default async function fail2ban(req, res, next) {
  const rawIp = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip || '').split(',')[0].trim();
  const ip = normalizeIp(rawIp);
  try {
    const status = await checkIp(ip);
    if (status && status.banned) {
      const remaining = status.remaining || 0;
      console.log(`[Fail2Ban] 🚫 BLOCKED: IP ${ip} is banned (${remaining}s remaining) - ${req.method} ${req.path}`);
      // include Retry-After header and return helpful JSON
      res.setHeader('Retry-After', String(remaining));
      return res.status(429).json({
        error: 'Too many failed attempts. Try again later.',
        banned: true,
        ip,
        remaining
      });
    }
  } catch (err) {
    console.error('Fail2Ban middleware error:', err && err.message);
    // fail-open: allow request to proceed
  }
  return next();
}
