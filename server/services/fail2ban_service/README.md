Fail2Ban-like microservice (Node.js)
====================================

Purpose
-------
Small, local Fail2Ban-like service used by the Node backend to track repeated failed attempts (e.g. login failures) and temporarily ban abusive IPs.

This service is intentionally lightweight and in-memory for development and testing. For production use you should move to a persistent store (Redis, DB) and secure the service.

Files
-----
- `index.js` - Node/Express application implementing `/check`, `/attempt`, and `/status` endpoints.
- `package.json` - Node dependencies and scripts.

Quick start
-----------

```bash
cd server/fail2ban_service
npm install
npm start
```

The service binds to `127.0.0.1:5000` by default.

Configuration
-------------
Environment variables:
- `FAILURE_WINDOW` (seconds) — how far back to count failures (default `300`)
- `FAILURE_THRESHOLD` — failures within the window before ban (default `5`)
- `BAN_TIME` (seconds) — how long to ban the IP (default `600`)
- `FAIL2BAN_HOST` — bind host (default `127.0.0.1`)
- `FAIL2BAN_PORT` — bind port (default `5000`)

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

Auto-start with other Node services
-----------------------------------

The root server starter `server/services/start-all-services.cjs` now includes this service as `fail2ban-service`.

From `server/`:

```bash
npm run start:fail2ban
```

or start all microservices:

```bash
npm run start
```

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
1. Start the Fail2Ban Node service.
2. From another terminal, call `/attempt` with `success:false` multiple times from the same IP until you reach the threshold. Then call `/check` and verify `banned:true`.
3. Call `/attempt` with `success:true` to clear failures and verify `/check` returns not banned.

Support
-------
If you want, I can:
- Add a small `README` (done), or expand with systemd / Windows service run examples.
- Convert storage to Redis and add configuration for redis connection.
- Add a small integration test script that simulates multiple failed login attempts.

