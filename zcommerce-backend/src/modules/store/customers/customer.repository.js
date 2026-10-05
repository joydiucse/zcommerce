import { scoped, scopedInsert, serializeJson } from '../../../app/tenant/tenant-scope.js';
import { db } from '../../../app/database/connection.js';

export class StoreCustomerRepository {
  findByEmail(email, trx = null) {
    return scoped('customers', trx).whereRaw('lower(customers.email) = ?', [String(email).toLowerCase()]).first();
  }

  findById(id, trx = null) {
    return scoped('customers', trx).where('customers.id', id).first();
  }

  async create(data, trx = null) {
    const [row] = await scopedInsert('customers', serializeJson(data, ['addresses']), trx);
    return row;
  }

  async update(id, data, trx = null) {
    const [row] = await scoped('customers', trx)
      .where('customers.id', id)
      .update({ ...serializeJson(data, ['addresses']), updated_at: db.fn.now() })
      .returning('*');
    return row;
  }
}
