import { verifyAccessToken } from '../security/jwt.js';
import { UnauthenticatedError } from '../../shared/exceptions/index.js';

export function extractBearer(req) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  return scheme && scheme.toLowerCase() === 'bearer' && token ? token.trim() : null;
}

/**
 * Verify the access token for an audience and set `req.auth` = decoded payload.
 * With `optional: true` a missing token passes through (an invalid one still fails).
 */
export function authenticate(audience, { optional = false } = {}) {
  return (req, _res, next) => {
    const token = extractBearer(req);
    if (!token) {
      if (optional) return next();
      return next(new UnauthenticatedError());
    }
    try {
      req.auth = verifyAccessToken(token, audience);
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

export default authenticate;
