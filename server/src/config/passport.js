import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
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

      // Check if user exists by email to link account
      const email = profile.emails[0].value;
      user = await User.findOne({ where: { email } });

      if (user) {
        user.googleId = profile.id;
        await user.save();
        return done(null, user);
      }

      // Create new user if doesn't exist
      user = await User.create({
        googleId: profile.id,
        email: email,
        username: email.split('@')[0] + '_' + Date.now(),
        playername: profile.displayName || email.split('@')[0],
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

      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      
      // If email is available, check for existing user to link
      if (email) {
        user = await User.findOne({ where: { email } });
        if (user) {
          user.githubId = profile.id;
          await user.save();
          return done(null, user);
        }
      }

      // Create new user if doesn't exist
      const finalEmail = email || `${profile.username}@github.com`;
      
      user = await User.create({
        githubId: profile.id,
        email: finalEmail,
        username: profile.username || profile.displayName || 'github_' + Date.now(),
        playername: profile.displayName || profile.username,
        passwordHash: null, // OAuth users don't need password
        provider: 'github'
      });

      done(null, user);
    } catch (err) {
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
