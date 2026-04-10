const express = require('express');
const router = express.Router();
const verifyJWT = require('../middleware/verifyJWT');
const {
  createRule,
  updateRule,
  deleteRule,
  listRules,
  getRuleHistory,
  downloadRule,
  shareRule,
} = require('../controllers/rulesController');

router.use(verifyJWT);

router.get('/', listRules);
router.post('/', createRule);
router.put('/:ruleId', updateRule);
router.delete('/:ruleId', deleteRule);
router.get('/:ruleId/history', getRuleHistory);
router.get('/:ruleId/download', downloadRule);
router.post('/:ruleId/share', shareRule);

module.exports = router;
