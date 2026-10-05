import { TenantRepository } from '../../../app/tenant/tenant-scope.js';
import { db } from '../../../app/database/connection.js';
import { paginateQuery } from '../../../shared/helpers/index.js';

export class CouponRepository extends TenantRepository {
  constructor() {
    super({ table: 'coupons' });
  }

  async list(query = {}) {
    const qb = this.query().select('coupons.*');
    if (query.is_active !== undefined) qb.where('coupons.is_active', query.is_active === true || query.is_active === 'true');
    if (query.type) qb.where('coupons.type', query.type);
    return paginateQuery(qb, query, {
      sortable: { created_at: 'coupons.created_at', code: 'coupons.code', used_count: 'coupons.used_count', ends_at: 'coupons.ends_at' },
      searchColumns: ['coupons.code'],
    });
  }

  findByCode(code, trx = null, { lock = false } = {}) {
    const qb = this.query(trx).where('coupons.code', String(code).trim().toUpperCase()).first();
    return lock ? qb.forUpdate() : qb;
  }

  incrementUsage(id, trx) {
    return this.query(trx).where('coupons.id', id).update({ used_count: db.raw('used_count + 1'), updated_at: db.fn.now() });
  }
}
