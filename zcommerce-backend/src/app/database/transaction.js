import { db } from './connection.js';

/**
 * Run `fn(trx)` inside a database transaction. Commits when fn resolves, rolls back when it throws.
 * If an outer transaction is supplied it is reused (no nested transaction).
 */
export async function withTransaction(fn, outerTrx = null) {
  if (outerTrx) return fn(outerTrx);
  return db.transaction(async (trx) => fn(trx));
}

export default withTransaction;
