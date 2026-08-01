'use strict';

function requireAuth(req, res, next) {
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized - missing user context' });
  }

  req.userId = userId;
  req.userRole = userRole || 'USER';
  req.userPhone = req.headers['x-user-phone'] || '';
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ error: `Forbidden - requires role: ${roles.join(' or ')}` });
    }
    next();
  };
}

function requireInternal(req, res, next) {
  const secret = req.headers['x-internal-secret'];
  if (secret !== (process.env.INTERNAL_EVENTS_SECRET || 'internal-service-secret')) {
    return res.status(401).json({ error: 'Unauthorized internal request' });
  }
  next();
}

module.exports = { requireAuth, requireRole, requireInternal };
