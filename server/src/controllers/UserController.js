import db from '../models/index.js';
import { Op } from 'sequelize';

const User = db.User;

/**
 * Internal function to update high score
 */
export const updateUserHighScore = async (username, score) => {
  if (!username || score === undefined) {
    throw new Error('username and score are required');
  }

  const parsedScore = parseInt(score, 10);
  if (Number.isNaN(parsedScore) || parsedScore < 0) {
    throw new Error('score must be a non-negative integer');
  }

  const user = await User.findOne({ where: { username } });
  if (!user) {
    throw new Error('User not found');
  }

  const previous = user.highScore || 0;
  if (parsedScore > previous) {
    user.highScore = parsedScore;
    await user.save();
    console.log(`🏆 New high score for ${username}: ${parsedScore} (previous: ${previous})`);
    return { updated: true, previous, highScore: parsedScore };
  }

  return { updated: false, previous, highScore: previous };
};

/**
 * Update player's high score if the provided score is greater than current.
 * @route POST /api/user/highscore
 * @body { username: string, score: number }
 */
const updateHighScore = async (req, res) => {
  try {
    const { username, score } = req.body;
    const result = await updateUserHighScore(username, score);
    return res.status(200).json(result);
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'username and score are required' || error.message === 'score must be a non-negative integer') {
      return res.status(400).json({ error: error.message });
    }
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

/**
 * Update user profile (playername)
 * @route PUT /api/user/profile
 */
const updateProfile = async (req, res) => {
  try {
    const { playername } = req.body;
    const userId = req.user.username; // Assuming auth middleware sets req.user

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (playername) {
      user.playername = playername;
    }

    await user.save();

    return res.json({ 
      message: 'Profile updated successfully',
      user: {
        username: user.username,
        email: user.email,
        playername: user.playername,
        role: user.role,
        status: user.status,
        highScore: user.highScore,
        userImage: user.userImage,
        walletAddress: user.walletAddress
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
};

/**
 * Change user password
 * @route PUT /api/user/password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.username;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    // Note: currentPassword should be hashed from client
    if (!user.validPassword(currentPassword)) {
      return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
    }

    // Update password
    user.passwordHash = newPassword;
    await user.save();

    return res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({ error: 'Failed to change password' });
  }
};

export default {
  updateHighScore,
  getLeaderboard,
  updateProfile,
  changePassword
};
