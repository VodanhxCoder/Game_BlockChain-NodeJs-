import passport from '../config/passportJwt.js';

const verifyToken = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ 
        authenticated: false,
        message: 'Unauthorized!',
        error: info ? info.message : 'Invalid token'
      });
    }
    req.user = user;
    next();
  })(req, res, next);
};

const authJwt = {
  verifyToken
};

export default authJwt;
