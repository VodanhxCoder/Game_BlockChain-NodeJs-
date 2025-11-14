import express from 'express';
import MarketController from '../controllers/MarketController.js';
import TradeController from '../controllers/TradeController.js';

const router = express.Router();

// GET /api/market/listings
router.get('/market/listings', MarketController.getListings);

// GET /api/market/items - available items to select as wanted-item
router.get('/market/items', MarketController.getWantedItems);

// POST /api/market/list - create a listing
router.post('/market/list', MarketController.createListing);

// POST /api/market/buy - buy a listing
router.post('/market/buy', MarketController.buyListing);

// POST /api/market/prepare-trade - prepare calldata for MetaMask
router.post('/market/prepare-trade', TradeController.prepareTrade);

// POST /api/market/confirm-trade - confirm trade after MetaMask tx is mined
router.post('/market/confirm-trade', TradeController.confirmTrade);

// POST /api/market/execute-trade - execute complete trade (new simplified flow)
router.post('/market/execute-trade', TradeController.executeTrade);

// POST /api/market/cancel - seller cancels listing
router.post('/market/cancel', MarketController.cancelListing);

export default router;
