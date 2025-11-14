/**
 * Email Verification Middleware
 * Handles email verification using in-memory storage instead of database
 */

const { sendEmail } = require('../utils/emailService');

// In-memory store for verification codes
// In production, consider using Redis or another cache solution
class EmailVerificationStore {
  constructor() {
    this.verifications = new Map();
    this.cleanup();
  }

  // Generate 6-digit verification code
  generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Store verification code with expiration
  storeVerification(email, code, username = null) {
    const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes
    this.verifications.set(email, {
      code,
      username,
      expiresAt,
      attempts: 0
    });
  }

  // Verify code
  verifyCode(email, code) {
    const verification = this.verifications.get(email);
    
    if (!verification) {
      return { success: false, error: 'Mã xác nhận không tồn tại hoặc đã hết hạn.' };
    }

    if (Date.now() > verification.expiresAt) {
      this.verifications.delete(email);
      return { success: false, error: 'Mã xác nhận đã hết hạn.' };
    }

    if (verification.attempts >= 5) {
      this.verifications.delete(email);
      return { success: false, error: 'Đã vượt quá số lần thử. Vui lòng yêu cầu mã mới.' };
    }

    verification.attempts++;

    if (verification.code !== code) {
      return { success: false, error: 'Mã xác nhận không đúng.' };
    }

    // Success - remove verification
    this.verifications.delete(email);
    return { success: true, username: verification.username };
  }

  // Get verification info (for resend)
  getVerification(email) {
    return this.verifications.get(email);
  }

  // Remove verification
  removeVerification(email) {
    return this.verifications.delete(email);
  }

  // Cleanup expired verifications (runs every 5 minutes)
  cleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [email, verification] of this.verifications.entries()) {
        if (now > verification.expiresAt) {
          this.verifications.delete(email);
        }
      }
    }, 5 * 60 * 1000);
  }

  // Get stats (for debugging)
  getStats() {
    return {
      totalVerifications: this.verifications.size,
      verifications: Array.from(this.verifications.entries()).map(([email, data]) => ({
        email,
        expiresAt: new Date(data.expiresAt),
        attempts: data.attempts
      }))
    };
  }
}

// Singleton instance
const emailVerificationStore = new EmailVerificationStore();

// Middleware functions
const emailVerificationMiddleware = {
  // Send verification email
  async sendVerificationCode(req, res) {
    try {
      const { email, username } = req.body;

      if (!email || !username) {
        return res.status(400).json({ 
          error: 'Email và username là bắt buộc.' 
        });
      }

      // Generate verification code
      const code = emailVerificationStore.generateCode();
      
      // Store verification
      emailVerificationStore.storeVerification(email, code, username);

      // Send email
      await sendEmail(
        email,
        'Xác nhận email đăng ký tài khoản',
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Xác nhận email đăng ký</h2>
          <p>Chào <strong>${username}</strong>,</p>
          <p>Mã xác nhận email của bạn là:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h1 style="color: #007bff; margin: 0; letter-spacing: 5px;">${code}</h1>
          </div>
          <p>Mã này sẽ hết hạn sau <strong>10 phút</strong>.</p>
          <p>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            Email này được gửi tự động, vui lòng không trả lời.
          </p>
        </div>
        `
      );

      res.json({ 
        message: 'Mã xác nhận đã được gửi đến email của bạn.',
        expiresIn: 600 // 10 minutes
      });

    } catch (error) {
      console.error('Error sending verification email:', error);
      res.status(500).json({ 
        error: 'Không thể gửi email xác nhận. Vui lòng thử lại sau.' 
      });
    }
  },

  // Verify email code
  async verifyEmailCode(req, res) {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({ 
          error: 'Email và mã xác nhận là bắt buộc.' 
        });
      }

      const result = emailVerificationStore.verifyCode(email, code.toString());

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({ 
        message: 'Xác nhận email thành công!',
        username: result.username 
      });

    } catch (error) {
      console.error('Error verifying email code:', error);
      res.status(500).json({ 
        error: 'Lỗi hệ thống. Vui lòng thử lại sau.' 
      });
    }
  },

  // Resend verification code
  async resendVerificationCode(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ 
          error: 'Email là bắt buộc.' 
        });
      }

      const existingVerification = emailVerificationStore.getVerification(email);
      
      if (!existingVerification) {
        return res.status(400).json({ 
          error: 'Không tìm thấy yêu cầu xác nhận cho email này.' 
        });
      }

      // Generate new code
      const code = emailVerificationStore.generateCode();
      
      // Update verification with new code
      emailVerificationStore.storeVerification(email, code, existingVerification.username);

      // Send email
      await sendEmail(
        email,
        'Mã xác nhận email mới',
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Mã xác nhận email mới</h2>
          <p>Chào <strong>${existingVerification.username}</strong>,</p>
          <p>Mã xác nhận email mới của bạn là:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h1 style="color: #007bff; margin: 0; letter-spacing: 5px;">${code}</h1>
          </div>
          <p>Mã này sẽ hết hạn sau <strong>10 phút</strong>.</p>
        </div>
        `
      );

      res.json({ 
        message: 'Mã xác nhận mới đã được gửi đến email của bạn.',
        expiresIn: 600 
      });

    } catch (error) {
      console.error('Error resending verification email:', error);
      res.status(500).json({ 
        error: 'Không thể gửi lại email xác nhận. Vui lòng thử lại sau.' 
      });
    }
  },

  // Get verification stats (for debugging)
  getStats(req, res) {
    res.json(emailVerificationStore.getStats());
  },

  // Clear verification (for cleanup)
  clearVerification(req, res) {
    const { email } = req.body;
    if (email) {
      const removed = emailVerificationStore.removeVerification(email);
      res.json({ removed });
    } else {
      res.status(400).json({ error: 'Email is required' });
    }
  }
};

module.exports = emailVerificationMiddleware;