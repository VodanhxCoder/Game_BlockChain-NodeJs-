# ARCHITECTURE: Microservice Redesign Blueprint

This file is the canonical architecture reference for the repository. Keep it synchronized with README service mapping and operational runbooks.

## 1. Purpose

This document redesigns the project architecture into a microservice-oriented layout with strict application layers:

- handler: HTTP or event entry points (REST controllers, socket adapters).
- service: business rules, domain orchestration, transactions.
- repository: database and blockchain persistence adapters.

Target outcome:

- clear bounded contexts,
- independently deployable services,
- RESTful API contracts,
- compatibility with existing gameplay and blockchain features.

## 1.1 Current Implementation Baseline (Repository Snapshot)

The repository already runs split backend services under `server/services`.

Implemented service names currently used in code/runtime:

- auth-service
- user-service
- inventory-service
- marketplace-service
- trade-service
- blockchain-service
- admin-service
- game-service
- fail2ban_service

Target naming in this archetype keeps domain clarity and may differ from runtime folder names during migration:

- user-service -> user-profile-service
- game-service -> game-session-service
- fail2ban_service -> security-intel-service

## 2. Target System Topology

### 2.1 Edge and Platform Services

1. api-gateway
- Single public entry for REST APIs.
- Routes to downstream services.
- Handles CORS, auth token forwarding, request ID, rate limits.

2. websocket-gateway
- Dedicated socket entry for real-time gameplay streams.
- Authenticates users and relays commands to game-session-service.

3. auth-service
- Local login, OAuth callback exchange, JWT issuance.
- Account status checks, email verification, password reset flows.

4. user-profile-service
- User profile data, settings, wallet linkage metadata.
- Current repository name: user-service.

5. game-session-service
- Authoritative game loop, player state, match/session events.
- Current repository name: game-service.

6. inventory-service
- Inventory ownership, item instances, collect/consume operations.

7. loot-service
- Drop pool rules and weighted reward calculations.

8. marketplace-service
- Listings, listing cancellation, listing signatures.

9. trade-service
- Trade lifecycle: prepare, validate, execute, confirm.
- Coordinates marketplace-service, inventory-service, blockchain-service.

10. blockchain-service
- Smart contract interactions (mint, transfer, ownership check, tx receipt).
- Exposes chain-safe operations to internal services.

11. admin-service
- Admin dashboard metrics and admin management APIs.

12. security-intel-service
- fail2ban-like IP checks, ban windows, abuse telemetry.
- Current repository name: fail2ban_service.

13. notification-service
- Email delivery for verification and operational notifications.

### 2.2 Data Stores (Per-Service Ownership)

- auth-db: credentials, provider links, verification states.
- user-db: profile, role, account status, wallet address.
- game-db: sessions, scores, game events.
- inventory-db: inventory and inventory items.
- loot-db: drop pools and drop history.
- market-db: listings and listing signatures.
- trade-db: trade logs, reconciliation records.
- security-db (or Redis): temporary bans, counters, challenge nonces.

Rule: each service writes only its own datastore; cross-service reads happen via API/events, not direct table access.

## 3. Standard Internal Service Layout

Every service follows this structure:

- src/handlers
- src/services
- src/repositories
- src/models
- src/routes
- src/middleware
- src/clients
- src/events
- src/config
- src/app.js

Example (trade-service):

- handlers/TradeHandler.js
- services/TradeService.js
- repositories/TradeRepository.js
- repositories/TradeReadRepository.js
- clients/MarketplaceClient.js
- clients/InventoryClient.js
- clients/BlockchainClient.js

## 4. Layer Responsibilities

### 4.1 Handler Layer

Responsibilities:

- Validate HTTP input shape.
- Parse auth claims and request metadata.
- Call one service method per use-case.
- Return canonical REST responses.

Must not:

- Contain persistence logic.
- Perform business rule branching beyond basic input validation.

### 4.2 Service Layer

Responsibilities:

- Enforce domain invariants.
- Orchestrate multi-step use cases.
- Execute transactional workflows.
- Publish domain events.

Must not:

- Build SQL directly.
- Depend on Express req/res objects.

### 4.3 Repository Layer

Responsibilities:

- Encapsulate Sequelize/SQL queries and persistence mapping.
- Expose explicit query methods per aggregate.
- Handle optimistic locking/version checks where needed.

Must not:

- Perform domain orchestration.
- Trigger side effects outside data access.

## 5. RESTful API Design Standards

### 5.1 URL Conventions

- Use nouns, plural resources.
- Use nested resources only when ownership is strict.
- Keep verbs out of URLs whenever possible.

Examples:

- GET /users/{userId}
- PATCH /users/{userId}
- GET /users/{userId}/inventory-items
- POST /market-listings
- DELETE /market-listings/{listingId}
- POST /trades
- GET /trades/{tradeId}

### 5.2 HTTP Method Semantics

- GET: read-only.
- POST: create command/result resource.
- PUT: full replacement.
- PATCH: partial update.
- DELETE: remove or cancel.

### 5.3 Response Envelope

Standard success response:

{
  "data": {},
  "meta": {
    "requestId": "uuid",
    "timestamp": "ISO-8601"
  }
}

Standard error response:

{
  "error": {
    "code": "TRADE_CONFLICT",
    "message": "Listing already fulfilled",
    "details": []
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "ISO-8601"
  }
}

### 5.4 Versioning

- External APIs: /v1/... via gateway.
- Internal service-to-service APIs: semantic version in contract docs and headers.

## 6. Suggested Service Contracts

### 6.1 auth-service

- POST /v1/auth/sessions
- DELETE /v1/auth/sessions/{sessionId}
- POST /v1/auth/oauth/google/callback
- POST /v1/auth/oauth/github/callback
- POST /v1/auth/email-verifications
- POST /v1/auth/password-resets

### 6.2 user-profile-service

- GET /v1/users/{userId}
- PATCH /v1/users/{userId}
- POST /v1/users/{userId}/wallet-challenges
- POST /v1/users/{userId}/wallet-verifications

### 6.3 game-session-service

- POST /v1/game-sessions
- GET /v1/game-sessions/{sessionId}
- PATCH /v1/game-sessions/{sessionId}
- POST /v1/game-sessions/{sessionId}/commands

### 6.4 inventory-service

- GET /v1/users/{userId}/inventory-items
- POST /v1/users/{userId}/inventory-items
- PATCH /v1/inventory-items/{itemInstanceId}

### 6.5 loot-service

- GET /v1/drop-pools
- POST /v1/drop-simulations
- POST /v1/drop-events

### 6.6 marketplace-service

- GET /v1/market-listings
- POST /v1/market-listings
- PATCH /v1/market-listings/{listingId}
- DELETE /v1/market-listings/{listingId}

### 6.7 trade-service

- POST /v1/trades
- GET /v1/trades/{tradeId}
- POST /v1/trades/{tradeId}/confirmations

### 6.8 blockchain-service (internal)

- POST /internal/v1/mints
- POST /internal/v1/transfers
- GET /internal/v1/ownership/{tokenId}
- GET /internal/v1/transactions/{hash}

## 7. Event-Driven Collaboration

Use asynchronous events for eventual consistency:

- listing.created
- listing.cancelled
- trade.prepared
- trade.executed
- trade.failed
- item.collected
- score.updated
- wallet.verified

Event bus options: RabbitMQ, Kafka, or Redis Streams.

Pattern:

1. service commits local transaction.
2. writes outbox row.
3. publisher emits event from outbox.
4. consumers apply idempotent handlers.

## 8. Domain Flow Mapping (Current Features -> Target Services)

### 8.1 Login + OAuth

api-gateway -> auth-service -> auth-repository

### 8.2 Wallet Link

api-gateway -> user-profile-service -> service verifies signature -> repository persists wallet binding -> event wallet.verified

### 8.3 Gameplay + Drops

websocket-gateway -> game-session-service -> emits enemy-killed event -> loot-service calculates drop -> inventory-service persists item

### 8.4 Listing + Trade + Chain Confirmation

api-gateway -> marketplace-service (create listing)

api-gateway -> trade-service (create trade)
trade-service calls:

- marketplace-service for listing lock,
- inventory-service for ownership validation,
- blockchain-service for on-chain execution,
- trade-repository for final ledger.

Then trade-service emits trade.executed or trade.failed.

## 9. Security and Compliance by Layer

- gateway: WAF rules, IP throttling, request size limits.
- handlers: schema validation + authorization checks.
- services: business authorization (owner, role, status).
- repositories: parameterized queries and tenant/user scoping.

Additional controls:

- Replace client-side password hashing with server-side salted hash (bcrypt/argon2).
- Store wallet challenges and anti-replay tokens in shared store (Redis).
- Add idempotency-key for POST /trades and POST /market-listings.

## 10. Deployment Archetype

### 10.1 Containerized Targets

- Each service has its own container image.
- Gateway and websocket gateway are independently scalable.
- Shared observability stack (OpenTelemetry, logs, tracing, metrics).

### 10.2 Environments

- dev: docker compose + local MySQL + local Hardhat + local message broker.
- staging: managed DBs + managed broker + testnet chain endpoints.
- prod: managed DBs, hardened network boundaries, secret manager, autoscaling.

## 11. Monorepo Directory Proposal

- services/
  - api-gateway/
  - websocket-gateway/
  - auth-service/
  - user-profile-service/
  - game-session-service/
  - inventory-service/
  - loot-service/
  - marketplace-service/
  - trade-service/
  - blockchain-service/
  - admin-service/
  - notification-service/
  - security-intel-service/
- shared/
  - contracts/
  - auth/
  - observability/
  - utils/
- infrastructure/
  - docker/
  - k8s/
  - terraform/ or bicep/

## 12. Migration Strategy (Incremental)

1. Extract API gateway facade in front of current server.
2. Split auth-service and user-profile-service first.
3. Extract marketplace-service and trade-service with strict API contracts.
4. Move blockchain logic into dedicated blockchain-service.
5. Extract game-session-service and websocket-gateway.
6. Migrate inventory and loot domains.
7. Introduce event bus + outbox for cross-service consistency.
8. Decommission monolithic route coupling.

### 12.1 Current Progress Snapshot

- Completed (current implementation): auth, user, inventory, marketplace, trade, blockchain, admin, and game services are already executable as separate service processes.
- Partially complete: monolith compatibility remains for selected flows; some cross-domain logic still needs stronger service ownership boundaries.
- Planned next focus:
  - introduce/strengthen API gateway and websocket gateway,
  - align runtime naming to target bounded contexts,
  - add outbox/event bus for eventual consistency,
  - complete repository-level ownership isolation per datastore.

## 13. Acceptance Criteria for the Redesign

- Every endpoint maps to handler -> service -> repository.
- No service directly queries another service database.
- Trade lifecycle is idempotent and auditable.
- API docs align with REST standards and return envelopes.
- Cross-service communication is observable with trace IDs.
- Existing gameplay and blockchain features remain functionally equivalent.

## 14. Final Summary

This project can evolve from a feature-rich monolith into a microservice platform by enforcing layered boundaries (handler/service/repository) and RESTful resource contracts per domain. The highest-value extraction sequence is auth/user first, then marketplace/trade/blockchain, followed by real-time gameplay and economy services with event-driven consistency.

## 15. Naming and Contract Alignment Rules

- Public docs should reference target domain names (for example, user-profile-service).
- Runtime startup scripts may keep legacy names temporarily (for example, user-service).
- API contracts must remain stable even when service folder/runtime names are transitioning.
- Keep this file and `README.md` aligned whenever service names, boundaries, or contracts change.
- When renaming runtime services, apply the same change in:
  - `README.md`
  - service startup scripts/runbooks
  - docker compose service labels
  - internal service client configuration
