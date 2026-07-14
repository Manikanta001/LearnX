const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getHint } = require('../controllers/hintController');

router.post('/', authenticate, getHint);

module.exports = router;
