const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const verifyJWT = require('../middleware/verifyJWT');
const {
  createRule,
  updateRule,
  deleteRule,
  listRules,
  getRuleHistory,
  downloadRule,
  shareRule,
  revokeShare,
} = require('../controllers/rulesController');

const shareLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(verifyJWT);

router.get('/', verifyJWT, listRules);
router.post('/', verifyJWT, createRule);
router.put('/:ruleId', verifyJWT, updateRule);
router.delete('/:ruleId', verifyJWT, deleteRule);
router.get('/:ruleId/history', verifyJWT, getRuleHistory);
router.get('/:ruleId/download', verifyJWT, downloadRule);
router.post('/:ruleId/share', verifyJWT, shareLimiter, shareRule);
router.delete('/:ruleId/share', verifyJWT, revokeShare);

module.exports = router;
