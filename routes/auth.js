const express = require('express');
const router = express.Router();
const verifyJWT = require('../middleware/verifyJWT');
const { googleAuth, googleAuthCallback, refresh, logout, getMe } = require('../controllers/authController');

router.get('/google', googleAuth);
router.get('/google/callback', googleAuthCallback);
router.get('/me', verifyJWT, getMe);
router.get('/refresh', refresh);
router.post('/logout', logout);

module.exports = router;
