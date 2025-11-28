import express from 'express';
import UserController from '../controllers/UserController.js';
import WalletController from '../controllers/WalletController.js';

const router = express.Router();

/**
 * @route POST /api/user/highscore
 * @desc Submit player's high score (game over)
 * @body { username: string, score: number }
 */
router.post('/user/highscore', UserController.updateHighScore);

/**
 * @route GET /api/user/leaderboard
 * @desc Get leaderboard entries (users with highScore > 0)
 */
router.get('/user/leaderboard', UserController.getLeaderboard);

/**
 * Wallet linking: create challenge and verify signature
 */
router.post('/user/wallet/challenge', WalletController.createChallenge);
router.post('/user/wallet/verify', WalletController.verifySignatureAndSave);

export default router;
