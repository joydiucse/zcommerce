export * from './response.js';
export * from './pagination.js';
export * from './order-totals.js';

/** Format a Date as YYYY-MM-DD (UTC). */
export const isoDate = (d) => new Date(d).toISOString().slice(0, 10);

/** Inclusive list of YYYY-MM-DD strings for the last `days` days ending today (UTC). */
export function lastNDays(days) {
  const out = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    out.push(isoDate(d));
  }
  return out;
}

/** Apply ?from&to (dates) filter on a timestamp column. `to` is inclusive of the whole day. */
export function applyDateRange(qb, column, from, to) {
  if (from) qb.where(column, '>=', new Date(from));
  if (to) {
    const end = new Date(to);
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(to))) end.setUTCDate(end.getUTCDate() + 1);
    qb.where(column, '<', end);
  }
  return qb;
}
