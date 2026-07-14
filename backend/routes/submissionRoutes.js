const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { submitSolution, runCode, getUserSubmissions } = require('../controllers/submissionController');

router.post('/submit', authenticate, submitSolution);
router.post('/run', runCode);
router.get('/', authenticate, getUserSubmissions);

module.exports = router;
