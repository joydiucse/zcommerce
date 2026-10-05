import jwt from 'jsonwebtoken';
import jwtConfig from '../config/jwt.config.js';
import redisConfig from '../config/redis.config.js';
import { cache } from '../../shared/utils/cache.js';
import { sha256, safeEqual, uuid } from './hash.js';
import { UnauthenticatedError } from '../../shared/exceptions/index.js';

const claimsFrom = ({ sub, aud, tenant_id, role_id }) => {
  const c = {};
  if (tenant_id) c.tenant_id = tenant_id;
  if (role_id) c.role_id = role_id;
  return { c, sub: String(sub), aud };
};

export function signAccessToken(payload) {
  const { c, sub, aud } = claimsFrom(payload);
  return jwt.sign({ ...c, type: 'access' }, jwtConfig.accessSecret, {
    subject: sub,
    audience: aud,
    issuer: jwtConfig.issuer,
    expiresIn: jwtConfig.accessTtl,
  });
}

export function verifyAccessToken(token, audience) {
  try {
    const decoded = jwt.verify(token, jwtConfig.accessSecret, { audience, issuer: jwtConfig.issuer });
    if (decoded.type !== 'access') throw new Error('wrong token type');
    return decoded;
  } catch (err) {
    throw new UnauthenticatedError(err.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid access token');
  }
}

/** Issue a refresh token and store its hash in Redis (`refresh:<aud>:<jti>`). */
export async function issueRefreshToken(payload) {
  const { c, sub, aud } = claimsFrom(payload);
  const jti = uuid();
  const token = jwt.sign({ ...c, type: 'refresh' }, jwtConfig.refreshSecret, {
    subject: sub,
    audience: aud,
    issuer: jwtConfig.issuer,
    expiresIn: jwtConfig.refreshTtl,
    jwtid: jti,
  });
  await cache.set(redisConfig.keys.refresh(aud, jti), { hash: sha256(token), sub }, jwtConfig.refreshTtl);
  return token;
}

/** Issue an access + refresh pair in the contract login shape (without `user`). */
export async function issueTokenPair(payload) {
  return {
    access_token: signAccessToken(payload),
    refresh_token: await issueRefreshToken(payload),
    expires_in: jwtConfig.accessTtl,
  };
}

function decodeRefresh(token, audience) {
  try {
    const decoded = jwt.verify(token, jwtConfig.refreshSecret, { audience, issuer: jwtConfig.issuer });
    if (decoded.type !== 'refresh' || !decoded.jti) throw new Error('wrong token type');
    return decoded;
  } catch {
    throw new UnauthenticatedError('Invalid or expired refresh token');
  }
}

/** Verify a refresh token against the stored hash and revoke it (rotation). Returns decoded payload. */
export async function consumeRefreshToken(token, audience) {
  const decoded = decodeRefresh(token, audience);
  const key = redisConfig.keys.refresh(audience, decoded.jti);
  const stored = await cache.get(key);
  if (!stored || !safeEqual(stored.hash, sha256(token))) {
    throw new UnauthenticatedError('Refresh token has been revoked');
  }
  await cache.del(key);
  return decoded;
}

/** Revoke a refresh token (logout). Silently ignores invalid tokens. */
export async function revokeRefreshToken(token, audience) {
  try {
    const decoded = decodeRefresh(token, audience);
    await cache.del(redisConfig.keys.refresh(audience, decoded.jti));
    return true;
  } catch {
    return false;
  }
}
