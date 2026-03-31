# Microservices Runbook

This server folder now includes service-based entrypoints in `services/`.

## Services and default ports

- auth-service: `4001`
- user-service: `4002`
- inventory-service: `4003`
- marketplace-service: `4004`
- trade-service: `4005`
- blockchain-service: `4006`
- admin-service: `4007`
- game-service (Socket.IO): `4008`

## Start one service

```bash
npm run start:auth
npm run start:user
npm run start:inventory
npm run start:marketplace
npm run start:trade
npm run start:blockchain
npm run start:admin
npm run start:game
```

## Start all services

```bash
npm run start:microservices
```

## Environment

1. Copy `.env.microservices.example` values into your `.env`.
2. Keep existing DB/JWT/OAuth settings from current setup.
3. Point the frontend API base URL to the API gateway (or directly to each service).

## Current split scope

- Auth endpoints: `/api/auth/*` and `/api/v1/auth/*`
- User endpoints: `/api/user/*` and `/api/v1/users/*`
- Inventory endpoints: `/api/inventory/*`, `/api/drop*`
- Marketplace endpoints: listing/wanted-item/list/buy/cancel + `/api/v1/market-listings*`
- Trade endpoints: `/api/market/*trade*` + `/api/v1/trades*`
- Blockchain endpoints: `/api/config`, `/api/v1/internal/blockchain/*`
- Admin endpoints: `/api/admin/*`, `/api/admin/dashboard/*`
- Game realtime: Socket.IO events in game-service

## Notes

- This is a decomposition layer built on top of existing controllers/models.
- Legacy monolith entrypoint (`src/server.js`) still works during migration.
- Next step is full physical extraction of models/controllers per service and separate databases.
