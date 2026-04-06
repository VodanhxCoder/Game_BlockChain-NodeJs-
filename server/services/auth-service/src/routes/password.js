import express from 'express';
import { forgotPassword } from '../controllers/PasswordResetController.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiter for forgot password to prevent abuse
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.' }
});

router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);

export default router;
