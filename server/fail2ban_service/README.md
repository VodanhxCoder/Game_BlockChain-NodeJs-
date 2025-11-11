Fail2Ban-like microservice (Flask)
=================================

Purpose
-------
Small, local Fail2Ban-like service used by the Node backend to track repeated failed attempts (e.g. login failures) and temporarily ban abusive IPs.

This service is intentionally lightweight and in-memory for development and testing. For production use you should move to a persistent store (Redis, DB) and secure the service.

Files
-----
- `app.py` - Flask application implementing `/check`, `/attempt`, and `/status` endpoints.
- `requirements.txt` - Python dependencies (Flask).

Quick start (Windows - cmd)
--------------------------
1. Create and activate a virtual environment (recommended):

```cmd
cd server\fail2ban_service
python -m venv .venv
.venv\Scripts\activate
```

2. Install dependencies and run the service:

```cmd
pip install -r requirements.txt
python app.py
```

The service will bind to `127.0.0.1:5000` by default.

Quick start (Linux / macOS)
---------------------------
```bash
cd server/fail2ban_service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Configuration
-------------
`app.py` defines three constants at top of file you can adjust directly:
- `FAILURE_WINDOW` (seconds) — how far back to count failures (default 300s)
- `FAILURE_THRESHOLD` — number of failures within the window that triggers a ban (default 5)
- `BAN_TIME` (seconds) — how long to ban the IP (default 600s)

Integration with Node backend
-----------------------------
- The Node service in this repository calls two endpoints:
  - `GET /check?ip=1.2.3.4` — returns `{ banned: true|false, remaining: seconds }`.
  - `POST /attempt` — body: `{ ip, success }`. When `success: false`, the service records a failure; when `success: true` it clears failure history for that IP.

- Example `POST /attempt` using `curl`:

```bash
curl -X POST http://127.0.0.1:5000/attempt -H "Content-Type: application/json" -d '{"ip":"127.0.0.1","success":false}'
```

- Example `GET /check`:

```bash
curl "http://127.0.0.1:5000/check?ip=127.0.0.1"
# -> { "banned": false, "remaining": 0 }
```

Auto-start from Node server
--------------------------

The main Node server (`server/src/server.js`) can optionally auto-start this Flask service when it boots. This is controlled by the environment variable `FAIL2BAN_AUTO_START` (default: `true`).

- To disable auto-start, set `FAIL2BAN_AUTO_START=false` in your `.env` or environment.
- To use a specific Python executable, set `FAIL2BAN_PYTHON` to the full command/path (e.g. `python3` or `C:\Python39\python.exe`).

Example (.env):

```
FAIL2BAN_AUTO_START=true
FAIL2BAN_PYTHON=python
```

When enabled, the Node process will spawn the Flask script `server/fail2ban_service/app.py` and pipe its stdout/stderr to the Node process output. If the script isn't present or the spawn fails, Node will continue to run and log a warning.

Notes & Recommendations
-----------------------
- Persistence: the current implementation stores state in-memory and will be lost on restart. Use Redis (fast) if you need durability and cross-process sharing.

- Security:
  - Bind the service to `127.0.0.1` (loopback) if it's used only by the local Node server.
  - Add mutual auth/token if you expose this service across the network.

- Availability: The Node middleware is written to "fail-open" (if the service is unreachable, requests continue). Decide whether you prefer fail-open or fail-closed for your deployment.

- Scaling: For high-volume deployments use a centralized store (Redis) and run multiple workers behind a process manager.

Testing
-------
1. Start the Flask service.
2. From another terminal, call `/attempt` with `success:false` multiple times from the same IP until you reach the threshold. Then call `/check` and verify `banned:true`.
3. Call `/attempt` with `success:true` to clear failures and verify `/check` returns not banned.

Support
-------
If you want, I can:
- Add a small `README` (done), or expand with systemd / Windows service run examples.
- Convert storage to Redis and add configuration for redis connection.
- Add a small integration test script that simulates multiple failed login attempts.

