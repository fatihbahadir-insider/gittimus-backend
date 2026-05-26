const passport = require('../config/passport');

const VALID_STATES = new Set(
  (process.env.OAUTH_VALID_STATES || 'extension,web').split(',').map((s) => s.trim())
);

const googleAuth = (req, res, next) => {
  const state = VALID_STATES.has(req.query.state) ? req.query.state : 'web';
  passport.authenticate('google', { scope: ['profile', 'email'], session: false, state })(req, res, next);
};

module.exports = googleAuth;
