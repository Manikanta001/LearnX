const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { scrapeLeetcodeProblem, fetchByProblemNumber } = require('../services/leetcodeService');

const ADMIN_NAME = process.env.ADMIN_NAME || 'admin';
const LEGACY_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_LOGIN_PASSWORD = process.env.ADMIN_LOGIN_PASSWORD || LEGACY_ADMIN_PASSWORD || 'admin123';
const ADMIN_PRIVATE_PASSWORD = process.env.ADMIN_PRIVATE_PASSWORD || LEGACY_ADMIN_PASSWORD || 'admin@9878';

const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const isTestApp = req.headers['x-test-app'] === 'true';

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // 1. Try to login via MongoDB Admin User
    const user = await User.findOne({ 
      $or: [
        { email: username.toLowerCase() },
        { name: new RegExp(`^${username}$`, 'i') }
      ],
      role: 'admin',
      isTestUser: isTestApp
    });

    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        const userJson = user.toObject();
        delete userJson.password;

        return res.json({
          success: true,
          accessToken,
          user: userJson,
        });
      }
    }

    // 2. Fallback to Legacy Environment Credentials
    const isLegacyValid =
      username.trim().toLowerCase() === ADMIN_NAME.toLowerCase() &&
      (password === ADMIN_LOGIN_PASSWORD || password === ADMIN_PRIVATE_PASSWORD);

    if (isLegacyValid) {
      // Find or create a mock admin user representation for token generation
      let adminUser = await User.findOne({ email: 'admin@learnx.com', isTestUser: isTestApp });
      if (!adminUser) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(ADMIN_PRIVATE_PASSWORD, salt);
        adminUser = new User({
          name: 'Admin',
          email: 'admin@learnx.com',
          password: hashedPassword,
          role: 'admin',
          isTestUser: isTestApp,
          solvedProblems: [],
          attemptedProblems: [],
        });
        await adminUser.save();
      }

      const accessToken = generateAccessToken(adminUser);
      const refreshToken = generateRefreshToken(adminUser);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const userJson = adminUser.toObject();
      delete userJson.password;

      return res.json({
        success: true,
        accessToken,
        user: userJson,
      });
    }

    return res.status(401).json({ error: 'Invalid admin credentials' });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error during admin login' });
  }
};

const scrapeAndPreviewLeetcode = async (req, res) => {
  try {
    const { url } = req.body || {};

    if (!url) {
      return res.status(400).json({ error: 'LeetCode URL is required' });
    }

    if (!url.includes('leetcode.com/problems/')) {
      return res.status(400).json({ 
        error: 'Invalid URL format. Expected: https://leetcode.com/problems/problem-name/' 
      });
    }

    console.log(`Admin scrape request for URL: ${url}`);
    const problemData = await scrapeLeetcodeProblem(url);
    console.log(`Successfully scraped: ${problemData.title}`);
    return res.json(problemData);
  } catch (error) {
    console.error('LeetCode scrape error:', error.message);
    
    let errorMsg = error.message;
    let suggestedAction = '';
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMsg = 'Cannot connect to LeetCode. Please check your internet connection.';
    } else if (error.response?.status === 429) {
      errorMsg = 'LeetCode is rate-limiting requests. Please try again in 1-2 minutes.';
      suggestedAction = 'Try again later or use manual entry.';
    } else if (error.response?.status === 403 || error.code === 'ETIMEDOUT') {
      errorMsg = 'LeetCode temporarily blocked the request. Using manual entry is recommended.';
      suggestedAction = 'Switch to "Add Manually" tab to enter problem details.';
    } else if (error.message.includes('Problem not found')) {
      errorMsg = 'Problem not found on LeetCode. Check the URL spelling.';
    }
    
    return res.status(400).json({ 
      error: errorMsg,
      suggestion: suggestedAction,
      code: error.code || 'SCRAPE_ERROR'
    });
  }
};

const fetchByNumber = async (req, res) => {
  try {
    const { number } = req.body || {};

    if (!number || isNaN(Number(number))) {
      return res.status(400).json({ error: 'A valid LeetCode problem number is required' });
    }

    console.log(`Admin fetch-by-number request: #${number}`);
    const problemData = await fetchByProblemNumber(Number(number));
    console.log(`Successfully fetched: ${problemData.title}`);
    return res.json(problemData);
  } catch (error) {
    console.error('Fetch by number error:', error.message);

    let errorMsg = error.message;
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMsg = 'Cannot connect to LeetCode. Check your internet connection.';
    } else if (error.response?.status === 429) {
      errorMsg = 'LeetCode is rate-limiting requests. Please try again in a minute.';
    } else if (error.response?.status === 403 || error.code === 'ETIMEDOUT') {
      errorMsg = 'LeetCode temporarily blocked the request. Try again shortly.';
    }

    return res.status(400).json({ error: errorMsg, code: error.code || 'FETCH_ERROR' });
  }
};

const getUsersList = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ error: 'Admin user not found' });
    }
    
    // Filter user list dynamically based on logged in admin's type (test vs real)
    const users = await User.find({ isTestUser: currentUser.isTestUser }).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Admin user list error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const toggleBlockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.user.id === userId) {
      return res.status(400).json({ error: 'You cannot block your own account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = await User.findById(req.user.id);
    if (!currentUser || currentUser.isTestUser !== user.isTestUser) {
      return res.status(403).json({ error: 'Access denied' });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({ message: user.isBlocked ? 'User blocked' : 'User unblocked', user });
  } catch (error) {
    console.error('Admin block user error:', error);
    res.status(500).json({ error: 'Failed to toggle user block status' });
  }
};

const deleteUserAccount = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if the current user is a real admin
    const currentUser = await User.findById(req.user.id);
    if (!currentUser || currentUser.role !== 'admin' || currentUser.isTestUser) {
      return res.status(403).json({ error: 'Access denied. Only real admins can delete accounts.' });
    }

    if (currentUser.id === userId) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete the user account
    await User.findByIdAndDelete(userId);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user account' });
  }
};

module.exports = { 
  loginAdmin, 
  scrapeAndPreviewLeetcode, 
  fetchByNumber,
  getUsersList,
  toggleBlockUser,
  deleteUserAccount,
};
