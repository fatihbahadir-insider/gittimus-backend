require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const connectDB = require('./config/dbConn');

const authRoutes = require('./routes/auth');
const rulesRoutes = require('./routes/rules');
const shareRoutes = require('./routes/share');

const app = express();
const PORT = process.env.PORT || 3500;

connectDB();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

app.use('/auth', authRoutes);
app.use('/rules', rulesRoutes);
app.use('/share', shareRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: 'Not found.' });
});

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
  });
});

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

mongoose.connection.on('error', (err) => {
  console.error(err);
});
