# Game_BlockChain-NodeJs-

Full-stack game platform with blockchain-enabled trading.

The system uses a React + Vite client and a Node.js backend that has been split into microservices. Smart contract workflows are supported through Hardhat and OpenZeppelin.

Architecture target and migration rules are defined in `ARCHETYPE.md`. This README reflects the current runnable setup and its mapping to the target service domains.

## System Architecture

### Frontend

- client app: React 19 + Vite
- API consumption: REST + Socket.IO
- key areas: auth, profile, inventory, market, realtime gameplay

### Backend Microservices

Services are started from server/services and currently run on these default ports:

- auth-service: 4001
- user-service: 4002
- inventory-service: 4003
- marketplace-service: 4004
- trade-service: 4005
- blockchain-service: 4006
- admin-service: 4007
- game-service (Socket.IO): 4008

Current decomposition follows handler/controller/service separation and is intended to evolve toward fully isolated service ownership.

### Service Mapping (Current Runtime -> Target Domain)

| Current runtime service | Target domain name in ARCHETYPE | Default port |
| --- | --- | --- |
| auth-service | auth-service | 4001 |
| user-service | user-profile-service | 4002 |
| inventory-service | inventory-service | 4003 |
| marketplace-service | marketplace-service | 4004 |
| trade-service | trade-service | 4005 |
| blockchain-service | blockchain-service | 4006 |
| admin-service | admin-service | 4007 |
| game-service | game-session-service | 4008 |
| fail2ban_service | security-intel-service | 5000 |

Note: naming is intentionally transitional during migration; runtime names may differ from final bounded-context names.

### Blockchain Layer

- smart contract source: server/contracts/ItemTradingNFT.sol
- deployment/testing scripts: server/scripts
- toolchain: Hardhat, Ethers, OpenZeppelin

## Project Structure

```text
.
├─ client/
│  ├─ src/components
│  ├─ src/context
│  ├─ src/pages
│  └─ src/routes
├─ server/
│  ├─ services/
│  │  ├─ auth-service/
│  │  ├─ user-service/
│  │  ├─ inventory-service/
│  │  ├─ marketplace-service/
│  │  ├─ trade-service/
│  │  ├─ blockchain-service/
│  │  ├─ admin-service/
│  │  ├─ game-service/
│  │  └─ shared/
│  ├─ contracts/
│  ├─ scripts/
│  └─ fail2ban_service/
└─ ARCHETYPE.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm
- MySQL or PostgreSQL (depending on your environment configuration)
- optional: Python 3 (for fail2ban_service)

### Install Dependencies

```bash
# frontend
cd client
npm install

# backend
cd ../server
npm install
```

### Run Frontend

```bash
cd client
npm run dev
```

### Run Backend Microservices

```bash
cd server
npm run start:microservices
```

You can also run each service independently:

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

## Tests

### Unit Tests (Jest, backend services)

Run unit tests from the repo root:

```bash
# auth service
npm --prefix server run test:auth

# admin service
npm --prefix server run test:admin

# game service
npm --prefix server run test:game
```

Or run all backend unit tests in one command:

```bash
npm run test:unit
```

Optional watch/coverage modes:

```bash
npm --prefix server run test:auth:watch
npm --prefix server run test:admin:coverage
```

### GUI Tests (Selenium)

Prereqs:

- Client app running at http://localhost:5173
- Backend services running (auth/admin/game endpoints)
- `msedgedriver` available on PATH (Edge WebDriver)
- Test credentials set in client/.env (TEST_USER_EMAIL, TEST_USER_PASSWORD, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)
- Captcha disabled or test keys configured for E2E

Set the browser (choose one command for your shell):

```bash
# PowerShell
$env:SELENIUM_BROWSER='edge'

# CMD
set SELENIUM_BROWSER=edge

# bash
export SELENIUM_BROWSER=edge
```

Run the GUI tests:

```bash
node client/tests/selenium/auth.tests.cjs
node client/tests/selenium/homepage.tests.cjs
node client/tests/selenium/admin-dashboard.tests.cjs
```

Or run all GUI tests in one command:

```bash
npm run test:gui
```

### Run All Tests

Run unit tests and then GUI tests (make sure the GUI test prereqs are running first):

```bash
npm run test:all
```

### Run Split Microservices With Docker

This repository now includes a compose setup that runs each backend service in its own container,
plus MySQL and a Hardhat node.

```bash
# from repository root
docker compose -f docker-compose.microservices.yml up --build
```

Services exposed on host:

- auth-service: 4001
- user-service: 4002
- inventory-service: 4003
- marketplace-service: 4004
- trade-service: 4005
- blockchain-service: 4006
- admin-service: 4007
- game-service: 4008
- fail2ban-service: 5000
- hardhat RPC: 8545
- mysql: 3306

To stop and remove containers:

```bash
docker compose -f docker-compose.microservices.yml down
```

To stop and remove containers and DB volume:

```bash
docker compose -f docker-compose.microservices.yml down -v
```

## Environment Configuration

Create server/.env and configure values for your setup.

Common variables:

```env
PORT=3000
JWT_SECRET=replace_me
EMAIL_USER=you@example.com
EMAIL_PASS=app_password
DATABASE_URL=mysql://user:password@localhost:3306/dbname
```

For microservice-specific setup, use server/.env.microservices.example as a base if present in your local branch.

## Documentation Index

Core architecture and operations:

- ARCHETYPE.md: target architecture blueprint and layering rules
- server/MICROSERVICES_RUNBOOK.md: service startup and split status
- server/BACKEND_HTTP_FUNCTION_SEPARATION.md: HTTP vs business-layer separation status

Feature-specific references:

- server/WALLET_MANAGEMENT.md: wallet linking and operational commands
- server/fail2ban_service/README.md: local fail2ban-like service for abuse control

## Current State Notes

- monolith compatibility is still partially preserved during migration
- several routes are already split by service, while some flows still need deeper extraction
- next phase: stronger per-service data ownership and event-driven integration where needed

## Migration Roadmap Alignment

Aligned with `ARCHETYPE.md` priorities:

1. keep auth/profile boundaries stable while removing residual monolith coupling
2. harden marketplace/trade/blockchain contracts and idempotency behavior
3. evolve game-service toward game-session-service + websocket-gateway topology
4. introduce outbox/event bus patterns for cross-service consistency
5. converge runtime service names to target bounded-context naming when operationally safe

## License

ISC (as declared in server/package.json)