import db from '../models/index.js';
import { createRequire } from 'module';
import crypto from 'crypto';

const require = createRequire(import.meta.url);
const emailService = require('../utils/emailService.js');
const { User } = db;

/**
 * Generate a random password
 * @param {number} length 
 * @returns {string}
 */
const generateRandomPassword = (length = 10) => {
  // Only use characters allowed by frontend sanitizer: a-z, A-Z, 0-9, @, ., -, _
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@";
  let retVal = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
};

/**
 * Hash password using SHA-256 (matching frontend logic)
 * @param {string} password 
 * @returns {string} hex string
 */
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

/**
 * Handle forgot password request
 * @route POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username || !email) {
      return res.status(400).json({ error: 'Vui lòng nhập Username và Email.' });
    }

    // Find user matching both username and email
    const user = await User.findOne({
      where: {
        username: username,
        email: email
      }
    });

    if (!user) {
      // Security: Don't reveal if user exists or not, but for this specific requirement "User must enter exactly", 
      // we can return a generic error or specific if required. 
      // "Người chơi cần nhập chính xác username và gmail" implies validation.
      return res.status(404).json({ error: 'Thông tin tài khoản hoặc email không chính xác.' });
    }

    // Kiểm tra nếu tài khoản đăng ký qua bên thứ 3 (Google, GitHub, ...)
    if (user.provider && user.provider !== 'local') {
      const providerName = user.provider.charAt(0).toUpperCase() + user.provider.slice(1);
      return res.status(400).json({ 
        error: `Tài khoản này được đăng ký qua ${providerName}. Vui lòng đăng nhập bằng ${providerName}.` 
      });
    }

    // Generate new password
    const newPassword = generateRandomPassword(12);
    const passwordHash = hashPassword(newPassword);

    // Update user password
    user.passwordHash = passwordHash;
    await user.save();

    // Send email
    await emailService.sendNewPasswordEmail(email, newPassword, username);

    return res.status(200).json({ message: 'Mật khẩu mới đã được gửi đến email của bạn.' });

  } catch (error) {
    console.error('Forgot Password Error:', error);
    return res.status(500).json({ error: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.' });
  }
};
