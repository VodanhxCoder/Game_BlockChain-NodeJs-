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
      attempts: 0,
      verified: false
    });
  }

  // Mark email as verified
  markAsVerified(email) {
    const verification = this.verifications.get(email);
    if (verification) {
      verification.verified = true;
      // Extend expiration after verification (30 minutes to complete signup)
      verification.expiresAt = Date.now() + (30 * 60 * 1000);
    }
  }

  // Check if email is verified
  isVerified(email) {
    const verification = this.verifications.get(email);
    return verification && verification.verified && Date.now() <= verification.expiresAt;
  }

  // Verify code
  verifyCode(email, code) {
    const verification = this.verifications.get(email);
    
    if (!verification) {
      return { success: false, error: 'Verification code does not exist or has expired.' };
    }

    if (Date.now() > verification.expiresAt) {
      this.verifications.delete(email);
      return { success: false, error: 'Verification code has expired.' };
    }

    if (verification.attempts >= 5) {
      this.verifications.delete(email);
      return { success: false, error: 'Too many attempts. Please request a new code.' };
    }

    verification.attempts++;

    if (verification.code !== code) {
      return { success: false, error: 'Incorrect verification code.' };
    }

    // Success - mark as verified (don't delete yet, need for signup)
    this.markAsVerified(email);
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
          error: 'Email and username are required.' 
        });
      }

      // Generate verification code
      const code = emailVerificationStore.generateCode();
      
      // Store verification
      emailVerificationStore.storeVerification(email, code, username);

      // Send email
      await sendEmail(
        email,
        'Email Verification Code',
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Hello <strong>${username}</strong>,</p>
          <p>Your email verification code is:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h1 style="color: #007bff; margin: 0; letter-spacing: 5px;">${code}</h1>
          </div>
          <p>This code will expire in <strong>10 minutes</strong>.</p>
          <p>If you did not request this, please ignore this email.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated email, please do not reply.
          </p>
        </div>
        `
      );

      res.json({ 
        message: 'Verification code has been sent to your email.',
        expiresIn: 600 // 10 minutes
      });

    } catch (error) {
      console.error('Error sending verification email:', error);
      res.status(500).json({ 
        error: 'Could not send verification email. Please try again later.' 
      });
    }
  },

  // Verify email code
  async verifyEmailCode(req, res) {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({ 
          error: 'Email and verification code are required.' 
        });
      }

      const result = emailVerificationStore.verifyCode(email, code.toString());

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({ 
        message: 'Email verified successfully!',
        username: result.username 
      });

    } catch (error) {
      console.error('Error verifying email code:', error);
      res.status(500).json({ 
        error: 'System error. Please try again later.' 
      });
    }
  },

  // Resend verification code
  async resendVerificationCode(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ 
          error: 'Email is required.' 
        });
      }

      const existingVerification = emailVerificationStore.getVerification(email);
      
      if (!existingVerification) {
        return res.status(400).json({ 
          error: 'No verification request found for this email.' 
        });
      }

      // Generate new code
      const code = emailVerificationStore.generateCode();
      
      // Update verification with new code
      emailVerificationStore.storeVerification(email, code, existingVerification.username);

      // Send email
      await sendEmail(
        email,
        'New Email Verification Code',
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Email Verification Code</h2>
          <p>Hello <strong>${existingVerification.username}</strong>,</p>
          <p>Your new email verification code is:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h1 style="color: #007bff; margin: 0; letter-spacing: 5px;">${code}</h1>
          </div>
          <p>This code will expire in <strong>10 minutes</strong>.</p>
        </div>
        `
      );

      res.json({ 
        message: 'New verification code has been sent to your email.',
        expiresIn: 600 
      });

    } catch (error) {
      console.error('Error resending verification email:', error);
      res.status(500).json({ 
        error: 'Could not resend verification email. Please try again later.' 
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
  },

  // Helper method to check if email is verified (for signup route)
  isEmailVerified(email) {
    return emailVerificationStore.isVerified(email);
  },

  // Helper method to clear email verification after successful signup
  clearEmailVerification(email) {
    return emailVerificationStore.removeVerification(email);
  }
};

module.exports = emailVerificationMiddleware;