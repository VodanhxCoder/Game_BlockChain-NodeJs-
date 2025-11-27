import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import db from '../models/index.js';
const { User } = db;

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
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8081/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ 
        where: { 
          googleId: profile.id 
        } 
      });

      if (user) {
        return done(null, user);
      }

      // Create new user if doesn't exist
      user = await User.create({
        googleId: profile.id,
        email: profile.emails[0].value,
        username: profile.emails[0].value.split('@')[0] + '_' + Date.now(),
        passwordHash: null, // OAuth users don't need password
        provider: 'google'
      });

      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }
));

// GitHub OAuth Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:8081/api/auth/github/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ 
        where: { 
          githubId: profile.id 
        } 
      });

      if (user) {
        return done(null, user);
      }

      // Create new user if doesn't exist
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : `${profile.username}@github.com`;
      
      user = await User.create({
        githubId: profile.id,
        email: email,
        username: profile.username || profile.displayName || 'github_' + Date.now(),
        passwordHash: null, // OAuth users don't need password
        provider: 'github'
      });

      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }
));

export default passport;
