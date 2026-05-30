const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

/**
 * JWT Bearer token authentication middleware.
 * Validates the token and checks for required scope.
 *
 * Usage: router.post('/events', requireScope('analytics:write'), handler)
 */
function requireScope(requiredScope) {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Missing or malformed Authorization header' },
      });
    }

    const token = authHeader.slice(7);

    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.tokenPayload = payload;

      const scopes = Array.isArray(payload.scopes) ? payload.scopes : [];
      if (!scopes.includes(requiredScope)) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: `Token missing required scope: ${requiredScope}`,
          },
        });
      }

      next();
    } catch (err) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
      });
    }
  };
}

module.exports = { requireScope };
