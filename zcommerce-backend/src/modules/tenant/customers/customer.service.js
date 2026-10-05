import { CrudService } from '../../../shared/helpers/crud.js';
import { hashPassword } from '../../../app/security/password.js';
import { NotFoundError } from '../../../shared/exceptions/index.js';
import { omit } from '../../../shared/utils/index.js';

export const presentCustomer = (row) => {
  if (!row) return row;
  return { ...omit(row, ['password_hash']), has_account: Boolean(row.password_hash) };
};

export class CustomerService extends CrudService {
  constructor({ customerRepository }) {
    super(customerRepository, { entity: 'Customer' });
  }

  present(row) {
    return presentCustomer(row);
  }

  async prepare(data) {
    if (data.password) data.password_hash = await hashPassword(data.password);
    delete data.password;
    return data;
  }

  async get(id) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError('Customer not found');
    return { ...this.present(row), recent_orders: await this.repo.recentOrders(id) };
  }
}
