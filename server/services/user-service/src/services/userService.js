import db from '../../../shared/models/index.js';
import { Op } from 'sequelize';

const { User } = db;

const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const updateUserHighScore = async (username, score) => {
  if (!username || score === undefined) {
    throw createHttpError(400, 'username and score are required');
  }

  const parsedScore = parseInt(score, 10);
  if (Number.isNaN(parsedScore) || parsedScore < 0) {
    throw createHttpError(400, 'score must be a non-negative integer');
  }

  const user = await User.findOne({ where: { username } });
  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  const previous = user.highScore || 0;
  if (parsedScore > previous) {
    user.highScore = parsedScore;
    await user.save();
    return { updated: true, previous, highScore: parsedScore };
  }

  return { updated: false, previous, highScore: previous };
};

const getLeaderboard = async ({ limit = 50 }) => {
  const safeLimit = Math.min(100, parseInt(limit, 10) || 50);

  const users = await User.findAll({
    where: {
      highScore: {
        [Op.gt]: 0,
      },
    },
    attributes: ['username', 'playername', 'userImage', 'highScore'],
    order: [['highScore', 'DESC']],
    limit: safeLimit,
  });

  return { total: users.length, leaderboard: users };
};

const updateProfile = async ({ username, playername }) => {
  const user = await User.findByPk(username);
  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  if (playername) {
    user.playername = playername;
  }

  await user.save();

  return {
    message: 'Profile updated successfully',
    user: {
      username: user.username,
      email: user.email,
      playername: user.playername,
      role: user.role,
      status: user.status,
      highScore: user.highScore,
      userImage: user.userImage,
      walletAddress: user.walletAddress,
    },
  };
};

const changePassword = async ({ username, currentPassword, newPassword }) => {
  const user = await User.findByPk(username);
  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  if (!user.validPassword(currentPassword)) {
    throw createHttpError(400, 'Mật khẩu hiện tại không đúng');
  }

  user.passwordHash = newPassword;
  await user.save();

  return { message: 'Đổi mật khẩu thành công' };
};

export default {
  updateUserHighScore,
  getLeaderboard,
  updateProfile,
  changePassword,
};
