const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');

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

module.exports = router;
