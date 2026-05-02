const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { getSharedRule } = require('../controllers/rulesController');

const viewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/:shareToken', viewLimiter, getSharedRule);

module.exports = router;
