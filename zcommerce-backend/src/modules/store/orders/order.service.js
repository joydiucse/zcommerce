import { NotFoundError, UnauthenticatedError } from '../../../shared/exceptions/index.js';
import { presentStoreOrder } from '../../tenant/orders/order.service.js';

export class StoreOrderService {
  constructor({ storeOrderRepository }) {
    this.repo = storeOrderRepository;
  }

  async list(customer, query) {
    const { data, meta } = await this.repo.listForCustomer(customer.id, query);
    const items = await this.repo.itemsFor(data.map((o) => o.id));
    return { data: data.map((o) => presentStoreOrder(o, items.filter((i) => i.order_id === o.id))), meta };
  }

  /** Customer token (must own the order) or ?email= for guests. Mismatches are reported as 404. */
  async get(orderNumber, { customer, email }) {
    if (!customer && !email) throw new UnauthenticatedError('Sign in or provide the order email to view this order');
    const order = await this.repo.findByNumber(orderNumber);
    const owns = order && customer && order.customer_id === customer.id;
    const emailMatches = order && email && order.email.toLowerCase() === String(email).trim().toLowerCase();
    if (!order || !(owns || emailMatches)) throw new NotFoundError('Order not found');
    return presentStoreOrder(order, await this.repo.itemsFor([order.id]));
  }
}
