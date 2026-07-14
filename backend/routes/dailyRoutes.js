const express = require('express');
const router = express.Router();
const { getDailyChallenge } = require('../controllers/dailyController');

router.get('/', getDailyChallenge);

module.exports = router;
