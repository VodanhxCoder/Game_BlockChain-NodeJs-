# Game_BlockChain-NodeJs-

Full-stack game platform with blockchain-enabled trading.

The system uses a React + Vite client and a Node.js backend that has been split into microservices. Smart contract workflows are supported through Hardhat and OpenZeppelin.

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

## License

ISC (as declared in server/package.json)