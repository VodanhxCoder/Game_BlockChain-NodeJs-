import express from 'express';
import MarketController from '../controllers/MarketController.js';
import authJwt from '../../../shared/middleware/authJwt.js';

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

// POST /api/market/cancel - seller cancels listing
router.post('/market/cancel', authJwt.verifyToken, MarketController.cancelListing);

export default router;
