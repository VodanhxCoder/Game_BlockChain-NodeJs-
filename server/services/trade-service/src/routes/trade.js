import express from 'express';
import TradeController from '../controllers/TradeController.js';
import authJwt from '../../../shared/middleware/authJwt.js';

const router = express.Router();

router.post('/trade/prepare', authJwt.verifyToken, TradeController.prepareTrade);
router.post('/trade/confirm', authJwt.verifyToken, TradeController.confirmTrade);
router.post('/trade/execute', authJwt.verifyToken, TradeController.executeTrade);

export default router;
