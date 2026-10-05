import crypto from 'node:crypto';

export const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

export const hmac = (value, secret) => crypto.createHmac('sha256', secret).update(String(value)).digest('hex');

export const randomToken = (bytes = 24) => crypto.randomBytes(bytes).toString('hex');

export const uuid = () => crypto.randomUUID();

/** Constant-time string comparison. */
export function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}
