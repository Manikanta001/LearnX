const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'learnx_access_token_secret_key_129837';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'learnx_refresh_token_secret_key_983741';

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
  } catch (error) {
    return null;
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
