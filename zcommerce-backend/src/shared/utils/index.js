export function slugify(input = '') {
  return String(input)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
}

export const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date);

/** Deep merge: objects merge recursively, arrays and scalars from `source` replace `target`. */
export function deepMerge(target, source) {
  if (!isPlainObject(target)) return source === undefined ? target : source;
  if (!isPlainObject(source)) return source === undefined ? structuredClone(target) : source;
  const out = structuredClone(target);
  for (const [key, value] of Object.entries(source)) {
    if (value === undefined) continue;
    out[key] = isPlainObject(value) && isPlainObject(out[key]) ? deepMerge(out[key], value) : value;
  }
  return out;
}

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}

export function omit(obj, keys) {
  const out = { ...obj };
  for (const k of keys) delete out[k];
  return out;
}

/** Remove secrets from a DB row before returning it. */
export const sanitizeUser = (row) => (row ? omit(row, ['password_hash']) : row);

export const toBool = (v) => v === true || v === 'true' || v === '1' || v === 1;

export const stripPort = (host = '') => String(host).trim().toLowerCase().replace(/:\d+$/, '');

/**
 * Canonical store host used for tenant matching: lower-case, no scheme/path/trailing dot,
 * default ports (80/443) dropped, any other port kept (so localhost:3001 ≠ localhost:3002).
 */
export function normalizeHost(input = '') {
  const h = String(input || '').split(',')[0].trim().toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, '')
    .split(/[/?#]/)[0]
    .replace(/\.(?=:\d+$|$)/, '');
  return h.replace(/:(80|443)$/, '');
}

/** Host (with port) of a site URL, normalised; null when the URL is empty/invalid. */
export function siteHostOf(url) {
  if (!url) return null;
  try {
    return normalizeHost(new URL(url).host) || null;
  } catch {
    return null;
  }
}
