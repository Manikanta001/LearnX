const User = require('../models/User');
const bcrypt = require('bcryptjs');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwt');

// Register a new user
const register = async (req, res) => {
  try {
    const { name, email, password, role, secretPassword } = req.body;
    const isTestApp = req.headers['x-test-app'] === 'true';

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Default first user to admin or keep simple register role
    const assignedRole = role && ['student', 'instructor', 'admin'].includes(role) ? role : 'student';

    // Verify secret password if instructor or admin
    if (assignedRole === 'instructor') {
      if (secretPassword !== 'teach@9878') {
        return res.status(400).json({ error: 'Invalid secret password for creating an instructor account' });
      }
    } else if (assignedRole === 'admin') {
      if (secretPassword !== 'admin@9878') {
        return res.status(400).json({ error: 'Invalid secret password for creating an admin account' });
      }
    }

    // Determine if user should be registered as a test user or real user
    let isTestUser = isTestApp;
    if (assignedRole === 'admin' && secretPassword === 'admin@9878') {
      isTestUser = false; // Always real admin
    } else if (assignedRole === 'instructor' && secretPassword === 'teach@9878') {
      isTestUser = false; // Always real instructor
    }

    const existingUser = await User.findOne({ email: email.toLowerCase(), isTestUser });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: assignedRole,
      isTestUser,
      solvedProblems: [],
      attemptedProblems: [],
      bookmarks: [],
      streak: 0,
      maxStreak: 0,
      lastSolvedDate: null,
      solveHistory: {},
      recentlySolved: [],
    };

    const newUser = new User(userData);
    await newUser.save();

    // Exclude password from output
    const userJson = newUser.toObject();
    delete userJson.password;

    res.status(201).json({ message: 'User registered successfully', user: userJson });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token as HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const userJson = user.toObject();
    delete userJson.password;

    res.json({
      message: 'Login successful',
      accessToken,
      user: userJson,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to authenticate user' });
  }
};

// Refresh access token
const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      return res.status(401).json({ error: 'Refresh token is required' });
    }

    const decoded = verifyRefreshToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const accessToken = generateAccessToken(user);
    res.json({ accessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, bio, skills, education, profilePicture, resumeUrl } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (skills !== undefined) updates.skills = skills;
    if (education !== undefined) updates.education = education;
    if (profilePicture !== undefined) updates.profilePicture = profilePicture;
    if (resumeUrl !== undefined) updates.resumeUrl = resumeUrl;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getProfile,
  updateProfile,
};
