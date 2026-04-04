import crypto from 'crypto';
import axios from 'axios';
import db from '../../../shared/models/index.js';
import emailService from '../../../shared/utils/emailService.js';

const { User } = db;

const createHttpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const generateRandomPassword = (length = 10) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@';
  let retVal = '';
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
};

const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');

const forgotPassword = async ({ email, recaptchaToken }) => {
  if (!email) {
    throw createHttpError(400, 'Vui lòng nhập Email.');
  }

  if (!recaptchaToken) {
    throw createHttpError(400, 'Vui lòng hoàn thành CAPTCHA.');
  }

  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (secretKey) {
    try {
      const verifyRes = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        null,
        { params: { secret: secretKey, response: recaptchaToken } }
      );

      if (!verifyRes.data.success) {
        throw createHttpError(400, 'Xác thực CAPTCHA thất bại.');
      }
    } catch (error) {
      if (error.status) {
        throw error;
      }
      throw createHttpError(500, 'Lỗi xác thực CAPTCHA.');
    }
  }

  const user = await User.findOne({
    where: { email },
  });

  if (!user) {
    throw createHttpError(404, 'Email không tồn tại trong hệ thống.');
  }

  if (user.provider && user.provider !== 'local') {
    const providerName = user.provider.charAt(0).toUpperCase() + user.provider.slice(1);
    throw createHttpError(
      400,
      `Tài khoản này được đăng ký qua ${providerName}. Vui lòng đăng nhập bằng ${providerName}.`
    );
  }

  const newPassword = generateRandomPassword(12);
  const passwordHash = hashPassword(newPassword);

  user.passwordHash = passwordHash;
  await user.save();

  await emailService.sendNewPasswordEmail(email, newPassword, user.username);

  return { message: 'Mật khẩu mới đã được gửi đến email của bạn.' };
};

export default {
  forgotPassword,
};
