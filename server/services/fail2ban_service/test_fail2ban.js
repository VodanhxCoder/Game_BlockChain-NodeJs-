const axios = require('axios');

// Usage: node test_fail2ban.js [NODE_BASE] [FAIL2_BASE] [ATTEMPTS]
// Example: node test_fail2ban.js http://127.0.0.1:3000 http://127.0.0.1:5000 7
const argv = process.argv.slice(2);
const NODE_BASE = argv[0] || process.env.NODE_BASE || 'http://127.0.0.1:6969';
const FAIL2_BASE = argv[1] || process.env.FAIL2_BASE || 'http://127.0.0.1:5000';
const attempts = parseInt(argv[2] || process.env.ATTEMPTS || '7', 10);

async function run() {
  console.log('Starting test: sending', attempts, 'failed login attempts to Node /api/login');
  for (let i = 1; i <= attempts; i++) {
    try {
      const r = await axios.post(`${NODE_BASE}/api/login`, { username: 'nosuchuser', passwordHash: 'deadbeef' }, { validateStatus: () => true });
      console.log(i, '->', r.status, r.data && (r.data.error || r.data.message || JSON.stringify(r.data)));
    } catch (e) {
      console.error('Request error', e.message);
    }
  }

  // Query check
  try {
    const s = await axios.get(`${FAIL2_BASE}/check`, { params: { ip: '127.0.0.1' } });
    console.log('Fail2Ban check:', s.data);
  } catch (e) {
    console.error('Fail2Ban check error', e.message);
  }
}

run();
