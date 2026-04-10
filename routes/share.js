const express = require('express');
const router = express.Router();
const { getSharedRule } = require('../controllers/rulesController');

router.get('/:shareToken', getSharedRule);

module.exports = router;
