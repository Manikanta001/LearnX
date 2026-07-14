const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { toggleBookmark, getBookmarks } = require('../controllers/bookmarkController');

router.post('/toggle', authenticate, toggleBookmark);
router.get('/', authenticate, getBookmarks);

module.exports = router;
