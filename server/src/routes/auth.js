import express from 'express';
import axios from 'axios';
const db = require('../models');
const User = db.User;
const { Op } = require('sequelize');
const passport = require('../config/passport');

const router = express.Router();

// Check session and return current user
router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    const user = req.user;
    return res.json({
      authenticated: true,
      user: {
        username: user.username,
        email: user.email,
        playername: user.playername || user.username,
        role: user.role,
        status: user.status,
        highScore: user.highScore || 0
      }
    });
  }
  res.json({ authenticated: false });
});

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    req.session.destroy();
    res.json({ success: true });
  });
});

// Google OAuth Routes
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/signin' }),
  (req, res) => {
    // Set session cookie maxAge (7 days)
    req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
    
    const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${CLIENT_URL}/H`); // Redirect directly to home
  }
);

// GitHub OAuth Routes
router.get('/github', passport.authenticate('github', { 
  scope: ['user:email'] 
}));

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/signin' }),
  (req, res) => {
    // Set session cookie maxAge (7 days)
    req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
    
    const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${CLIENT_URL}/H`); // Redirect directly to home
  }
);

/**
 * POST /api/login
 * Handles user login.
 * Expects { username, passwordHash } in the request body.
 * Frontend sends a SHA-256 hex digest of the password. We store and compare
 * that hex string directly (no extra hashing on the server).
 */
router.post('/login', async (req, res) => {
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
      await axios.post(`${FAIL2BAN_URL}/attempt`, { ip: nip, success }, { timeout: 2000 });
    } catch (err) {
      // don't block login flow if fail2ban service is down
      console.error('notifyFail2ban error:', err && err.message);
    }
  };

  try {
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
      const clientIp = getClientIp(req);
      console.log(`[Fail2Ban] ❌ Failed login attempt for username: ${username} from IP: ${clientIp}`);
      try { await notifyFail2ban(clientIp, false); } catch (e) {}
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Compare the SHA-256 hex string directly with stored value
    const isValid = user.validPassword(passwordHash);

    if (!isValid) {
      const clientIp = getClientIp(req);
      console.log(`[Fail2Ban] ❌ Failed login attempt for username: ${username} from IP: ${clientIp}`);
      try { await notifyFail2ban(clientIp, false); } catch (e) {}
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Successful login
    // Notify fail2ban of successful auth (clears failures)
    const clientIp = getClientIp(req);
    console.log(`[Fail2Ban] ✅ Successful login for username: ${username} from IP: ${clientIp} - clearing ban history`);
    try { await notifyFail2ban(clientIp, true); } catch (e) {}

    return res.status(200).json({
      message: 'Login successful.',
      user: {
        username: user.username,
        email: user.email,
        playername: user.playername,
        role: user.role,
        status: user.status,
        highScore: user.highScore,
        userImage: user.userImage,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/signup
 * Handles user registration.
 * Expects { username, email, passwordHash, playername } in the request body.
 * Frontend sends a SHA-256 hex digest; the server stores that value directly.
 */
router.post('/signup', async (req, res) => {
  const { username, email, passwordHash, playername } = req.body;

  try {
    // Validate input
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
      if (existingUser.username === username) {
        return res.status(409).json({ error: 'Username already taken.' });
      }
      if (existingUser.email === email) {
        return res.status(409).json({ error: 'Email already registered.' });
      }
    }

    // Create new user (passwordHash will be stored as provided by frontend)
    const newUser = await User.create({
      username: username.trim(),
      email: email.trim(),
      passwordHash, // Frontend sends SHA-256; store directly
      playername: playername ? playername.trim() : username.trim(),
      role: 'player',
      status: 'active',
      highScore: 0,
    });

    // Return success with user data
    return res.status(201).json({
      message: 'Account created successfully.',
      user: {
        username: newUser.username,
        email: newUser.email,
        playername: newUser.playername,
        role: newUser.role,
        status: newUser.status,
        highScore: newUser.highScore,
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

export default router;