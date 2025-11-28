import db from '../models/index.js';
import { Op } from 'sequelize';

const User = db.User;

/**
 * Update player's high score if the provided score is greater than current.
 * @route POST /api/user/highscore
 * @body { username: string, score: number }
 */
const updateHighScore = async (req, res) => {
  try {
    const { username, score } = req.body;

    if (!username || score === undefined) {
      return res.status(400).json({ error: 'username and score are required' });
    }

    const parsedScore = parseInt(score, 10);
    if (Number.isNaN(parsedScore) || parsedScore < 0) {
      return res.status(400).json({ error: 'score must be a non-negative integer' });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const previous = user.highScore || 0;
    if (parsedScore > previous) {
      user.highScore = parsedScore;
      await user.save();
      console.log(`🏆 New high score for ${username}: ${parsedScore} (previous: ${previous})`);
      return res.status(200).json({ updated: true, previous, highScore: parsedScore });
    }

    // Not a new high score
    return res.status(200).json({ updated: false, previous, highScore: previous });
  } catch (error) {
    console.error('Error updating high score:', error);
    return res.status(500).json({ error: 'Failed to update high score' });
  }
};

/**
 * Get leaderboard entries (users with highScore > 0), ordered desc by highScore
 * @route GET /api/user/leaderboard
 */
const getLeaderboard = async (req, res) => {
  try {
    // optional ?limit= query param
    const limit = Math.min(100, parseInt(req.query.limit || '50', 10));

    const users = await User.findAll({
      where: {
        highScore: {
          [Op.gt]: 0,
        },
      },
      attributes: ['username', 'playername', 'userImage', 'highScore'],
      order: [['highScore', 'DESC']],
      limit,
    });

    return res.status(200).json({ total: users.length, leaderboard: users });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};

export default {
  updateHighScore,
  getLeaderboard
};
