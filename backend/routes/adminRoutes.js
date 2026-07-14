const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleAuth');
const {
  loginAdmin,
  scrapeAndPreviewLeetcode,
  fetchByNumber,
  getUsersList,
  toggleBlockUser,
  deleteUserAccount,
} = require('../controllers/adminController');

// Admin credentials authentication
router.post('/login', loginAdmin);

// Problem scraping & User blocking (requires admin role verification)
router.post('/scrape-leetcode', authenticate, isAdmin, scrapeAndPreviewLeetcode);
router.post('/fetch-by-number', authenticate, isAdmin, fetchByNumber);
router.get('/users', authenticate, isAdmin, getUsersList);
router.post('/users/:userId/toggle-block', authenticate, isAdmin, toggleBlockUser);
router.delete('/users/:userId', authenticate, isAdmin, deleteUserAccount);

module.exports = router;
