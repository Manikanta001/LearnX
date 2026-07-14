const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  register,
  login,
  refresh,
  logout,
  getProfile,
  updateProfile,
} = require('../controllers/authController');

// Open routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Authenticated routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

module.exports = router;
