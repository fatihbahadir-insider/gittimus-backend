const jwt = require('jsonwebtoken');
const passport = require('../config/passport');
const User = require('../models/User');

const generateAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });

const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const googleAuth = passport.authenticate('google', { scope: ['profile', 'email'], session: false });

const googleAuthCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user) => {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    if (err || !user)
      return res.redirect(`${clientUrl}/auth/error?reason=unauthorized`);

    try {
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      user.refreshToken = refreshToken;
      await user.save();

      res.cookie('jwt', refreshToken, COOKIE_OPTIONS);
      res.redirect(`${clientUrl}/auth/callback?token=${accessToken}`);
    } catch (e) {
      next(e);
    }
  })(req, res, next);
};

const refresh = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt)
    return res.status(401).json({ message: 'Unauthorized.' });

  const refreshToken = cookies.jwt;

  const user = await User.findOne({ refreshToken });
  if (!user)
    return res.status(403).json({ message: 'Forbidden.' });

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err || user._id.toString() !== decoded.id)
      return res.status(403).json({ message: 'Forbidden.' });

    const accessToken = generateAccessToken(user._id);
    res.json({ accessToken });
  });
};

const logout = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204);

  const refreshToken = cookies.jwt;

  const user = await User.findOne({ refreshToken });
  if (user) {
    user.refreshToken = null;
    await user.save();
  }

  res.clearCookie('jwt', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
  });

  res.sendStatus(204);
};

const getMe = async (req, res) => {
  const user = await User.findById(req.userId).select('-refreshToken');
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.json(user);
};

module.exports = { googleAuth, googleAuthCallback, refresh, logout, getMe };
