import userService from '../services/userService.js';

/**
 * Internal function to update high score
 */
export const updateUserHighScore = async (username, score) => {
  return userService.updateUserHighScore(username, score);
};

/**
 * Update player's high score if the provided score is greater than current.
 * @route POST /api/user/highscore
 * @body { username: string, score: number }
 */
const updateHighScore = async (req, res) => {
  try {
    const result = await userService.updateUserHighScore(req.body.username, req.body.score);
    return res.status(200).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
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
    const result = await userService.getLeaderboard({ limit: req.query.limit });
    return res.status(200).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
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
    const result = await userService.updateProfile({
      username: req.user.username,
      playername: req.body.playername,
    });
    return res.json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
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
    const result = await userService.changePassword({
      username: req.user.username,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    });
    return res.json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
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
