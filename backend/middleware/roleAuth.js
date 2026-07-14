// Role authorization middleware
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. Please authenticate first.' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden. You do not have permission to access this resource.' });
    }

    next();
  };
};

const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access denied' });
  }
  next();
};

const isInstructor = (req, res, next) => {
  if (!req.user || (req.user.role !== 'instructor' && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Instructor access denied' });
  }
  next();
};

module.exports = {
  authorize,
  isAdmin,
  isInstructor,
};
