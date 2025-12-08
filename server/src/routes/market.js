import express from 'express';
import MarketController from '../controllers/MarketController.js';
import TradeController from '../controllers/TradeController.js';
import authJwt from '../middleware/authJwt.js';

const router = express.Router();

// GET /api/market/listings
router.get('/market/listings', MarketController.getListings);

// GET /api/market/items - available items to select as wanted-item
router.get('/market/items', MarketController.getWantedItems);

// POST /api/market/list - create a listing
router.post('/market/list', authJwt.verifyToken, MarketController.createListing);

// PATCH /api/market/update-signature - update listing with seller signature
router.patch('/market/update-signature', authJwt.verifyToken, MarketController.updateSignature);

// POST /api/market/buy - buy a listing
router.post('/market/buy', authJwt.verifyToken, MarketController.buyListing);

// POST /api/market/prepare-trade - prepare calldata for MetaMask
router.post('/market/prepare-trade', authJwt.verifyToken, TradeController.prepareTrade);

// POST /api/market/confirm-trade - confirm trade after MetaMask tx is mined
router.post('/market/confirm-trade', authJwt.verifyToken, TradeController.confirmTrade);

// POST /api/market/execute-trade - execute complete trade (new simplified flow)
router.post('/market/execute-trade', authJwt.verifyToken, TradeController.executeTrade);

// POST /api/market/cancel - seller cancels listing
router.post('/market/cancel', authJwt.verifyToken, MarketController.cancelListing);

export default router;
