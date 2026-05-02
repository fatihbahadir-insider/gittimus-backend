const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const User = require('../models/User');

const ALLOWED_DOMAINS = ['useinsider.com', 'insiderone.com'];

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3500/auth/google/callback',
}, async (_accessToken, _refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    if (!email) return done(null, false, { message: 'No email returned from Google.' });

    const domain = email.split('@')[1];
    if (!ALLOWED_DOMAINS.includes(domain))
      return done(null, false, { message: 'Email domain not allowed.' });

    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        user.googleId = profile.id;
        user.name = profile.displayName;
        await user.save();
      } else {
        user = await User.create({ googleId: profile.id, email, name: profile.displayName });
      }
    }

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

module.exports = passport;
