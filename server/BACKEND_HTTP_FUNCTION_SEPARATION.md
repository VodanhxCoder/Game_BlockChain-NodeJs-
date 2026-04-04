# Backend HTTP Request vs Function Separation

## Goal
Keep HTTP concerns (request parsing, status codes, response formatting) separate from business functions (domain logic, transactions, validation, orchestration).

## Separated in This Update

### Marketplace Service
- HTTP request handlers:
  - `services/marketplace-service/src/routes/market.js`
  - `services/marketplace-service/src/controllers/MarketController.js`
- Business functions:
  - `services/marketplace-service/src/services/marketplaceService.js`

Moved business logic out of controller into service functions:
- `getListings`
- `getWantedItems`
- `createListing`
- `buyListing`
- `cancelListing`
- `updateSignature`

## Current Backend Layer Map

### HTTP Route Layer (Express routers)
- `services/user-service/src/routes/user.js`
- `services/trade-service/src/routes/trade.js`
- `services/inventory-service/src/routes/inventory.js`
- `services/marketplace-service/src/routes/market.js`
- `services/admin-service/src/routes/dashboard.js`
- `services/admin-service/src/routes/admin.js`
- `services/blockchain-service/src/routes/config.js`
- `services/auth-service/src/routes/password.js`
- `services/auth-service/src/routes/auth.js`

### HTTP Controller Layer (Req/Res handlers)
- `services/user-service/src/controllers/UserController.js`
- `services/user-service/src/controllers/WalletController.js`
- `services/trade-service/src/controllers/TradeController.js`
- `services/inventory-service/src/controllers/InventoryController.js`
- `services/marketplace-service/src/controllers/MarketController.js`
- `services/admin-service/src/controllers/DashboardController.js`
- `services/auth-service/src/controllers/PasswordResetController.js`

### Business Function Layer
- `services/marketplace-service/src/services/marketplaceService.js`
- `services/inventory-service/src/controllers/DropController.js` (pure logic despite controller folder)
- `services/game-service/src/game/GameEngine.js`
- `services/game-service/src/game/GameSessionManager.js`

## Files Still Mixing HTTP + Business Logic (Recommended Next)
- `services/admin-service/src/routes/admin.js`
  - Contains many inline async handlers with DB/business logic directly in router.
- `services/auth-service/src/routes/auth.js`
  - Contains multiple inline route handlers with validation/auth/session/business flow logic.
- `services/blockchain-service/src/routes/config.js`
  - Simple case, but handler is still inline in route file.

## Recommended Separation Pattern
1. Keep route file only for endpoint registration and middleware.
2. Keep controller file only for req/res mapping and error translation.
3. Move domain logic to `src/services/*.js` as pure async functions.
4. Keep model access inside services (or repositories if added later).

## Suggested Next Refactor Order
1. `auth-service/src/routes/auth.js` -> create `controllers/AuthController.js` + `services/authService.js`
2. `admin-service/src/routes/admin.js` -> create `controllers/AdminController.js` + `services/adminService.js`
3. `trade-service/src/controllers/TradeController.js` -> split into controller + `services/tradeService.js`
