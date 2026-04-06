import express from 'express';
import UserController from '../controllers/UserController.js';
import WalletController from '../controllers/WalletController.js';
import authJwt from '../../../shared/middleware/authJwt.js';

const router = express.Router();

/**
 * @route POST /api/user/highscore
 * @desc Submit player's high score (game over)
 * @body { username: string, score: number }
 */
router.post('/user/highscore', authJwt.verifyToken, UserController.updateHighScore);

/**
 * @route GET /api/user/leaderboard
 * @desc Get leaderboard entries (users with highScore > 0)
 */
router.get('/user/leaderboard', UserController.getLeaderboard);

/**
 * Wallet linking: create challenge and verify signature
 */
router.post('/user/wallet/challenge', authJwt.verifyToken, WalletController.createChallenge);
router.post('/user/wallet/verify', authJwt.verifyToken, WalletController.verifySignatureAndSave);

/**
 * @route PUT /api/user/profile
 * @desc Update user profile
 */
router.put('/user/profile', authJwt.verifyToken, UserController.updateProfile);

/**
 * @route PUT /api/user/password
 * @desc Change user password
 */
router.put('/user/password', authJwt.verifyToken, UserController.changePassword);

export default router;
