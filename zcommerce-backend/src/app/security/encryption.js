import crypto from 'node:crypto';
import { env } from '../config/env.js';

// AES-256-GCM. Key derived from ENCRYPTION_KEY so any length secret works.
const key = crypto.createHash('sha256').update(env.ENCRYPTION_KEY).digest();

/** Encrypt a string -> "iv.tag.ciphertext" (base64url parts). */
export function encrypt(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, enc].map((b) => b.toString('base64url')).join('.');
}

export function decrypt(payload) {
  const [iv, tag, enc] = String(payload).split('.').map((p) => Buffer.from(p, 'base64url'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}
