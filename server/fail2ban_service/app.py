from flask import Flask, request, jsonify
import time
from collections import defaultdict

app = Flask(__name__)

# Configurable parameters
FAILURE_WINDOW = int(300)  # seconds to track failures
FAILURE_THRESHOLD = int(5)  # number of failed attempts to ban
BAN_TIME = int(600)  # seconds to ban

# In-memory store: { ip: { 'fails': [timestamps], 'banned_until': ts } }
attempts = defaultdict(lambda: { 'fails': [], 'banned_until': 0 })

def now():
    return int(time.time())


def normalize_ip(ip):
    """Normalize IPv6-mapped IPv4 and loopback addresses to a consistent representation.
    Examples: '::1' -> '127.0.0.1', '::ffff:127.0.0.1' -> '127.0.0.1'
    """
    if not ip:
        return ip
    ip = ip.strip()
    # IPv6 loopback
    if ip == '::1':
        return '127.0.0.1'
    # IPv4 mapped in IPv6
    if ip.startswith('::ffff:'):
        parts = ip.split(':')
        if parts:
            return parts[-1]
    return ip

@app.route('/check', methods=['GET'])
def check():
    ip = request.args.get('ip') or request.remote_addr
    ip = normalize_ip(ip)
    entry = attempts[ip]
    banned = entry.get('banned_until', 0) > now()
    remaining = max(0, entry.get('banned_until', 0) - now()) if banned else 0
    return jsonify({ 'banned': banned, 'remaining': remaining })

@app.route('/attempt', methods=['POST'])
def attempt():
    data = request.get_json() or {}
    ip = data.get('ip') or request.remote_addr
    ip = normalize_ip(ip)
    success = data.get('success', False)

    entry = attempts[ip]
    cur = now()

    # Clear expired ban
    if entry.get('banned_until', 0) and entry['banned_until'] <= cur:
        entry['banned_until'] = 0
        entry['fails'] = []

    if success:
        # On success, clear failure history
        entry['fails'] = []
        entry['banned_until'] = 0
        return jsonify({ 'ok': True, 'banned': False })

    # Record failure
    entry['fails'] = [ts for ts in entry['fails'] if ts >= cur - FAILURE_WINDOW]
    entry['fails'].append(cur)

    if len(entry['fails']) >= FAILURE_THRESHOLD:
        entry['banned_until'] = cur + BAN_TIME
        return jsonify({ 'ok': True, 'banned': True, 'remaining': BAN_TIME })

    return jsonify({ 'ok': True, 'banned': False, 'fails': len(entry['fails']) })

@app.route('/status', methods=['GET'])
def status():
    # Return a summary (not required in production)
    summary = {}
    for ip, entry in attempts.items():
        nip = normalize_ip(ip)
        # ensure we key by normalized ip in summary
        key = nip
        banned = entry.get('banned_until', 0) > now()
        summary[key] = {
            'fails': len([ts for ts in entry['fails'] if ts >= now() - FAILURE_WINDOW]),
            'banned': banned,
            'remaining': max(0, entry.get('banned_until', 0) - now()) if banned else 0
        }
    return jsonify(summary)

if __name__ == '__main__':
    print('Starting Fail2Ban service on http://127.0.0.1:5000')
    print(f'Configuration: FAILURE_WINDOW={FAILURE_WINDOW}s, THRESHOLD={FAILURE_THRESHOLD}, BAN_TIME={BAN_TIME}s')
    app.run(host='127.0.0.1', port=5000, threaded=True, use_reloader=False)
