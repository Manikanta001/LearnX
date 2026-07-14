const { verifyAccessToken } = require('../utils/jwt');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split('Bearer ')[1];
  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired access token' });
  }

  // Populate req.user for controllers
  req.user = {
    id: decoded.id,
    uid: decoded.id, // compatibility fallback for legacy Firebase controllers
    email: decoded.email,
    role: decoded.role,
    name: decoded.name,
  };

  next();
};

module.exports = { authenticate };
