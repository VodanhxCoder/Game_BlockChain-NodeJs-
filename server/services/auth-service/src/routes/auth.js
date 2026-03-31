import express from 'express';
import axios from 'axios';
import db from '../../../shared/models/index.js';
const { User } = db;
import { Op } from 'sequelize';
import passport from '../../../shared/config/passport.js';
import emailVerificationMiddleware from '../../../shared/middleware/emailVerification.js';
import jwt from 'jsonwebtoken';
import authJwt from '../../../shared/middleware/authJwt.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Middleware to handle validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

// Helper to sign JWT
const signToken = (user) => {
  return jwt.sign(
    { username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Check session and return current user (Now using JWT)
router.get('/me', authJwt.verifyToken, (req, res) => {
  const user = req.user;
  return res.json({
    authenticated: true,
    user: {
      username: user.username,
      email: user.email,
      playername: user.playername || user.username,
      role: user.role,
      status: user.status,
      highScore: user.highScore || 0,
      userImage: user.userImage,
      walletAddress: user.walletAddress || null,
      createdAt: user.createdAt
    }
  });
});

// Logout (Client side just clears token)
router.post('/logout', authJwt.verifyToken, (req, res) => {
  // Optional: Blacklist token here if using Redis
  res.json({ success: true });
});

// Google OAuth Routes
router.get('/google', (req, res, next) => {
  // Store the redirect URL if provided
  if (req.query.redirect_url) {
    req.session.authRedirectUrl = req.query.redirect_url;
  }
  next();
}, passport.authenticate('google', { 
  scope: ['profile', 'email'],
  session: false // Disable session for JWT flow
}));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/signin', session: false }),
  (req, res) => {
    const user = req.user;
    const token = signToken(user);
    
    const redirectUrl = req.session.authRedirectUrl || process.env.CLIENT_URL || 'http://localhost:5173';
    delete req.session.authRedirectUrl;
    
    // Redirect to frontend with token
    res.redirect(`${redirectUrl}/auth/callback?token=${token}`);
  }
);

// GitHub OAuth Routes
router.get('/github', (req, res, next) => {
  if (req.query.redirect_url) {
    req.session.authRedirectUrl = req.query.redirect_url;
  }
  next();
}, passport.authenticate('github', { 
  scope: ['user:email'],
  session: false
}));

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/signin', session: false }),
  (req, res) => {
    const user = req.user;
    const token = signToken(user);
    
    const redirectUrl = req.session.authRedirectUrl || process.env.CLIENT_URL || 'http://localhost:5173';
    delete req.session.authRedirectUrl;
    
    // Redirect to frontend with token
    res.redirect(`${redirectUrl}/auth/callback?token=${token}`);
  }
);

/**
 * POST /api/login
 * Handles user login.
 * Expects { username, passwordHash } in the request body.
 * Frontend sends a SHA-256 hex digest of the password. We store and compare
 * that hex string directly (no extra hashing on the server).
 */
router.post('/login', 
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('passwordHash').notEmpty().withMessage('Password is required')
  ],
  validate,
  async (req, res) => {
  const { username, passwordHash } = req.body;
  const FAIL2BAN_URL = process.env.FAIL2BAN_URL || 'http://127.0.0.1:5000';

  const getClientIp = (r) => {
    const raw = (r.headers['x-forwarded-for'] || r.connection.remoteAddress || r.ip || '').split(',')[0].trim();
    // normalize IPv6 loopback and IPv4-mapped IPv6
    if (raw === '::1') return '127.0.0.1';
    if (raw && raw.startsWith('::ffff:')) return raw.split(':').pop();
    return raw;
  };

  const notifyFail2ban = async (ip, success) => {
    try {
      const nip = (ip === '::1') ? '127.0.0.1' : (ip && ip.startsWith('::ffff:') ? ip.split(':').pop() : ip);
      console.log(`[Fail2Ban] Notifying ${FAIL2BAN_URL}/attempt: ip=${nip}, success=${success}`);
      const response = await axios.post(`${FAIL2BAN_URL}/attempt`, { ip: nip, success }, { timeout: 2000 });
      console.log(`[Fail2Ban] Response:`, response.data);
    } catch (err) {
      // don't block login flow if fail2ban service is down
      console.error('notifyFail2ban error:', err && err.message);
    }
  };

  try {
    // Check if IP is banned before processing login
    const clientIp = getClientIp(req);
    const nip = (clientIp === '::1') ? '127.0.0.1' : (clientIp && clientIp.startsWith('::ffff:') ? clientIp.split(':').pop() : clientIp);
    
    let failsCount = 0;
    try {
      const checkResponse = await axios.get(`${FAIL2BAN_URL}/check`, { 
        params: { ip: nip },
        timeout: 1000 
      });
      if (checkResponse.data) {
        failsCount = checkResponse.data.fails_count || 0;
        if (checkResponse.data.banned) {
          console.log(`[Fail2Ban] 🚫 Blocked login attempt from banned IP: ${nip}, remaining: ${checkResponse.data.remaining}s`);
          return res.status(429).json({ 
            error: 'Too many failed login attempts. Please try again later.',
            remaining: checkResponse.data.remaining 
          });
        }
      }
    } catch (checkErr) {
      // If fail2ban is down, allow the login attempt to proceed
      console.log(`[Fail2Ban] Check failed (service may be down), allowing attempt: ${checkErr.message}`);
    }

    // Check if CAPTCHA is required (after 2 failed attempts)
    if (failsCount > 2) {
       const { recaptchaToken } = req.body;
       if (!recaptchaToken) {
         return res.status(401).json({ 
           error: 'Please complete the CAPTCHA.',
           requiresCaptcha: true 
         });
       }
       
       // Verify CAPTCHA
       const secretKey = process.env.RECAPTCHA_SECRET_KEY;
       if (secretKey) {
         try {
            const verifyRes = await axios.post(
              'https://www.google.com/recaptcha/api/siteverify',
              null,
              { params: { secret: secretKey, response: recaptchaToken } }
            );
            if (!verifyRes.data.success) {
               return res.status(401).json({ 
                 error: 'CAPTCHA verification failed.',
                 requiresCaptcha: true 
               });
            }
         } catch (err) {
            console.error('CAPTCHA verification error:', err);
            return res.status(500).json({ error: 'CAPTCHA verification error' });
         }
       }
    }

    // Debug log to help trace login attempts (do not log full passwords in production)
    //console.log('Login attempt for:', username, 'hash(prefix):', (passwordHash || '').slice(0, 12));
    // Validate input
    if (!username || !passwordHash) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    // Try to find the user by username OR email (frontend may submit email)
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username: username },
          { email: username }
        ]
      }
    });

    if (!user) {
      // notify fail2ban about failed attempt
      console.log(`[Fail2Ban] ❌ Failed login attempt for username: ${username} from IP: ${clientIp}`);
      try { await notifyFail2ban(clientIp, false); } catch (e) {}
      return res.status(401).json({ 
        error: 'Invalid username or password.',
        requiresCaptcha: failsCount >= 2
      });
    }

    // Check if user account is banned
    if (user.status === 'banned') {
      console.log(`[Auth] 🚫 Banned user attempted login: ${username} from IP: ${clientIp}`);
      return res.status(403).json({ 
        error: `Your account has been banned. Time: ${new Date().toLocaleString()}. Please contact support for assistance.`,
        isBanned: true
      });
    }

    // Check if user account is inactive
    if (user.status === 'inactive') {
      console.log(`[Auth] ⚠️ Inactive user attempted login: ${username} from IP: ${clientIp}`);
      return res.status(403).json({ 
        error: 'Your account is inactive. Please contact support to reactivate your account.',
        isInactive: true
      });
    }

    // Compare the SHA-256 hex string directly with stored value
    const isValid = user.validPassword(passwordHash);

    if (!isValid) {
      console.log(`[Fail2Ban] ❌ Failed login attempt for username: ${username} from IP: ${clientIp}`);
      try { await notifyFail2ban(clientIp, false); } catch (e) {}
      return res.status(401).json({ 
        error: 'Invalid username or password.',
        requiresCaptcha: failsCount >= 2
      });
    }

    // Successful login
    // Notify fail2ban of successful auth (clears failures)
    console.log(`[Fail2Ban] ✅ Successful login for username: ${username} from IP: ${clientIp} - clearing ban history`);
    try { await notifyFail2ban(clientIp, true); } catch (e) {}

    // Generate JWT
    const token = signToken(user);

    return res.status(200).json({
      message: 'Login successful.',
      token: token,
      user: {
        username: user.username,
        email: user.email,
        playername: user.playername,
        role: user.role,
        status: user.status,
        highScore: user.highScore,
        userImage: user.userImage,
        walletAddress: user.walletAddress || null,
        createdAt: user.createdAt
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/signup
 * Handles user registration with email verification.
 * Step 1: Send verification code to email
 * Step 2: User verifies email with code
 * Step 3: Create user account after verification
 */
router.post('/signup', 
  [
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
    body('email').trim().isEmail().withMessage('Invalid email address'),
    body('passwordHash').notEmpty().withMessage('Password is required')
      // SHA-256 hash is 64 characters. Client validates original length (8-50).
      .isLength({ min: 64, max: 64 }).withMessage('Invalid password format')
  ],
  validate,
  async (req, res) => {
  const { username, email, passwordHash, playername } = req.body;

  try {
    // Validate input (Already handled by express-validator, but keeping check for safety)
    if (!username || !email || !passwordHash) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      // Case-insensitive check
      if (existingUser.username.toLowerCase() === username.toLowerCase()) {
        return res.status(409).json({ error: 'Username already taken.' });
      }
      if (existingUser.email.toLowerCase() === email.toLowerCase()) {
        return res.status(409).json({ error: 'Email already registered.' });
      }
      // Fallback if somehow neither matched but record was found
      return res.status(409).json({ error: 'Username or email already exists.' });
    }

    // Check if email has been verified
    if (!emailVerificationMiddleware.isEmailVerified(email)) {
      return res.status(403).json({ 
        error: 'Email verification required. Please verify your email before signing up.',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    // Create new user
    const newUser = await User.create({
      username: username.trim(),
      email: email.trim(),
      passwordHash, // Frontend sends SHA-256; store directly
      playername: playername ? playername.trim() : username.trim(),
      role: 'player',
      status: 'active',
      highScore: 0
    });

    // Generate JWT
    const token = signToken(newUser);

    // Return success with user data and token
    return res.status(201).json({
      message: 'Account created successfully.',
      token: token,
      user: {
        username: newUser.username,
        email: newUser.email,
        playername: newUser.playername,
        role: newUser.role,
        status: newUser.status,
        highScore: newUser.highScore,
        createdAt: newUser.createdAt
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message).join(', ');
      return res.status(400).json({ error: messages });
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Username or email already exists.' });
    }

    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/auth/check-availability
 * Kiểm tra email và username có sẵn sàng chưa
 */
router.post('/check-availability', async (req, res) => {
  try {
    const { email, username } = req.body;

    if (!email || !username) {
      return res.status(400).json({ error: 'Email and username are required.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      // Case-insensitive check
      if (existingUser.username.toLowerCase() === username.toLowerCase()) {
        return res.status(409).json({ 
          available: false,
          error: 'Username already taken.' 
        });
      }
      if (existingUser.email.toLowerCase() === email.toLowerCase()) {
        return res.status(409).json({ 
          available: false,
          error: 'Email already registered.' 
        });
      }
      // Fallback
      return res.status(409).json({ 
        available: false,
        error: 'Username or email already exists.' 
      });
    }

    return res.json({ 
      available: true,
      message: 'Email and username are available.' 
    });
  } catch (error) {
    console.error('Check availability error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/auth/send-verification
 * Gửi mã xác nhận email (sau khi check availability)
 */
router.post('/send-verification', async (req, res) => {
  try {
    const { email, username } = req.body;

    if (!email || !username) {
      return res.status(400).json({ error: 'Email and username are required.' });
    }

    // Check if user already exists before sending email
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      // Case-insensitive check
      if (existingUser.username.toLowerCase() === username.toLowerCase()) {
        return res.status(409).json({ error: 'Username already taken.' });
      }
      if (existingUser.email.toLowerCase() === email.toLowerCase()) {
        return res.status(409).json({ error: 'Email already registered.' });
      }
      // Fallback
      return res.status(409).json({ error: 'Username or email already exists.' });
    }

    // If available, send verification email
    return emailVerificationMiddleware.sendVerificationCode(req, res);
  } catch (error) {
    console.error('Send verification error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/auth/verify-email
 * Xác nhận email với mã 6 số
 */
router.post('/verify-email', emailVerificationMiddleware.verifyEmailCode);

/**
 * POST /api/auth/resend-verification
 * Gửi lại mã xác nhận email
 */
router.post('/resend-verification', emailVerificationMiddleware.resendVerificationCode);

/**
 * GET /api/auth/check-status
 * Checks if the current IP requires CAPTCHA or is banned.
 */
router.get('/check-status', async (req, res) => {
  const FAIL2BAN_URL = process.env.FAIL2BAN_URL || 'http://127.0.0.1:5000';
  
  const getClientIp = (r) => {
    const raw = (r.headers['x-forwarded-for'] || r.connection.remoteAddress || r.ip || '').split(',')[0].trim();
    if (raw === '::1') return '127.0.0.1';
    if (raw && raw.startsWith('::ffff:')) return raw.split(':').pop();
    return raw;
  };

  try {
    const clientIp = getClientIp(req);
    const nip = (clientIp === '::1') ? '127.0.0.1' : (clientIp && clientIp.startsWith('::ffff:') ? clientIp.split(':').pop() : clientIp);
    
    const checkResponse = await axios.get(`${FAIL2BAN_URL}/check`, { 
      params: { ip: nip },
      timeout: 1000 
    });

    if (checkResponse.data) {
      const failsCount = checkResponse.data.fails_count || 0;
      const banned = checkResponse.data.banned || false;
      
      return res.json({
        requiresCaptcha: failsCount > 2,
        banned: banned,
        remaining: checkResponse.data.remaining || 0
      });
    }
    
    return res.json({ requiresCaptcha: false });
  } catch (error) {
    console.error('Error checking auth status:', error.message);
    // Default to safe state if check fails
    return res.json({ requiresCaptcha: false });
  }
});

export default router;