import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import crypto from 'crypto';
import db from '../models/index.js';
const { User } = db;

const makeOauthPasswordHash = () => crypto.randomBytes(32).toString('hex');
const trimTo = (value, maxLen) => String(value || '').slice(0, maxLen);
const logOauthDbError = (provider, err) => {
  console.error(`[OAuth:${provider}] ${err?.name || 'Error'}: ${err?.message || 'Unknown error'}`);
  if (err?.parent?.code || err?.parent?.sqlMessage) {
    console.error(`[OAuth:${provider}] SQL ${err.parent.code || ''}: ${err.parent.sqlMessage || ''}`.trim());
  }
};

const USERNAME_MAX = 50;
const cleanUsernameBase = (value, fallback = 'oauth_user') => {
  const normalized = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized || fallback;
};

const buildUniqueUsername = async (rawBase) => {
  const base = cleanUsernameBase(rawBase);
  for (let i = 0; i < 6; i += 1) {
    const suffix = crypto.randomBytes(4).toString('hex');
    const maxBaseLen = USERNAME_MAX - (suffix.length + 1);
    const trimmedBase = base.slice(0, Math.max(1, maxBaseLen));
    const candidate = `${trimmedBase}_${suffix}`;
    const exists = await User.findByPk(candidate);
    if (!exists) return candidate;
  }
  return `oauth_${Date.now().toString().slice(-8)}`;
};

// Serialize user for session
passport.serializeUser((user, done) => {
  console.log('[Passport] Serializing user:', user.username);
  done(null, user.username); // Use username as primary key
});

// Deserialize user from session
passport.deserializeUser(async (username, done) => {
  console.log('[Passport] Deserializing user:', username);
  try {
    const user = await User.findByPk(username);
    console.log('[Passport] Found user:', user ? user.username : 'null');
    done(null, user);
  } catch (err) {
    console.error('[Passport] Deserialize error:', err);
    done(err, null);
  }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4001/auth-service/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const googleId = trimTo(profile?.id, 255);
      const rawEmail = profile?.emails?.[0]?.value;
      const fallbackEmail = `google_${googleId}@oauth.local`;
      const email = trimTo(String(rawEmail || fallbackEmail).trim().toLowerCase(), 100);

      // Check if user already exists
      let user = await User.findOne({ 
        where: { 
          googleId 
        } 
      });

      if (user) {
        return done(null, user);
      }

      // Check if user exists by email to link account
      user = await User.findOne({ where: { email } });

      if (user) {
        user.googleId = googleId;
        try {
          await user.save();
        } catch (saveErr) {
          if (saveErr?.name === 'SequelizeUniqueConstraintError') {
            const linkedUser = await User.findOne({ where: { googleId } });
            if (linkedUser) return done(null, linkedUser);
          }
          throw saveErr;
        }
        return done(null, user);
      }

      const generatedUsername = await buildUniqueUsername(email.split('@')[0]);
      const playername = trimTo(profile.displayName || email.split('@')[0], 100);

      // Create new user if doesn't exist
      try {
        user = await User.create({
          googleId,
          email,
          username: generatedUsername,
          playername,
          // Keep compatibility with schemas where password_hash is still NOT NULL.
          passwordHash: makeOauthPasswordHash(),
          provider: 'google'
        });
      } catch (createErr) {
        if (createErr?.name === 'SequelizeUniqueConstraintError') {
          const existingByGoogleId = await User.findOne({ where: { googleId } });
          if (existingByGoogleId) return done(null, existingByGoogleId);

          const existingByEmail = await User.findOne({ where: { email } });
          if (existingByEmail) {
            existingByEmail.googleId = googleId;
            await existingByEmail.save();
            return done(null, existingByEmail);
          }
        }
        throw createErr;
      }

      done(null, user);
    } catch (err) {
      logOauthDbError('google', err);
      done(err, null);
    }
  }
));

// GitHub OAuth Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:4001/auth-service/auth/github/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const githubId = trimTo(profile?.id, 255);
      // Check if user already exists
      let user = await User.findOne({ 
        where: { 
          githubId 
        } 
      });

      if (user) {
        return done(null, user);
      }

      const email = profile.emails && profile.emails[0]
        ? trimTo(String(profile.emails[0].value || '').trim().toLowerCase(), 100)
        : null;
      
      // If email is available, check for existing user to link
      if (email) {
        user = await User.findOne({ where: { email } });
        if (user) {
          user.githubId = githubId;
          await user.save();
          return done(null, user);
        }
      }

      // Create new user if doesn't exist
      const finalEmail = email || trimTo(`${profile.username || 'github_user'}@github.com`, 100);
      const generatedUsername = await buildUniqueUsername(profile.username || profile.displayName || 'github_user');
      const playername = trimTo(profile.displayName || profile.username || 'GitHub User', 100);
      
      user = await User.create({
        githubId,
        email: finalEmail,
        username: generatedUsername,
        playername,
        // Keep compatibility with schemas where password_hash is still NOT NULL.
        passwordHash: makeOauthPasswordHash(),
        provider: 'github'
      });

      done(null, user);
    } catch (err) {
      logOauthDbError('github', err);
      done(err, null);
    }
  }
));

// JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'your_jwt_secret', // Fallback if env not set
};

passport.use(new JwtStrategy(jwtOptions, async (jwt_payload, done) => {
  try {
    // jwt_payload should contain the data we signed (username, role)
    const user = await User.findByPk(jwt_payload.username);
    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  } catch (err) {
    return done(err, false);
  }
}));

export default passport;
