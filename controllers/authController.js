const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const generateAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });

const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

const register = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required.' });

  const existing = await User.findOne({ email });
  if (existing)
    return res.status(409).json({ message: 'Email already in use.' });

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({ email, password: hashedPassword });

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  res.cookie('jwt', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({ accessToken });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required.' });

  const user = await User.findOne({ email });
  if (!user)
    return res.status(401).json({ message: 'Invalid credentials.' });

  const match = await bcrypt.compare(password, user.password);
  if (!match)
    return res.status(401).json({ message: 'Invalid credentials.' });

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  res.cookie('jwt', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ accessToken });
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
  if (!cookies?.jwt)
    return res.sendStatus(204);

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

module.exports = { register, login, refresh, logout };
