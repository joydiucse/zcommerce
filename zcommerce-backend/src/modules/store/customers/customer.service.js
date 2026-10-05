import { hashPassword, verifyPassword } from '../../../app/security/password.js';
import { issueTokenPair, consumeRefreshToken, revokeRefreshToken } from '../../../app/security/jwt.js';
import { getTenant, getTenantId } from '../../../app/tenant/tenant-context.js';
import { ConflictError, UnauthenticatedError } from '../../../shared/exceptions/index.js';
import { enqueueEmail } from '../../../jobs/queues/index.js';

const AUD = 'customer';

/** Public customer shape (never includes password_hash). */
export const presentStoreCustomer = (c) => ({
  id: c.id,
  name: c.name,
  email: c.email,
  phone: c.phone,
  accepts_marketing: c.accepts_marketing,
  addresses: c.addresses || [],
  orders_count: c.orders_count,
  total_spent: c.total_spent,
  created_at: c.created_at,
});

export class StoreCustomerService {
  constructor({ storeCustomerRepository, settingService }) {
    this.repo = storeCustomerRepository;
    this.settings = settingService;
  }

  async issue(customer) {
    const tokens = await issueTokenPair({ sub: customer.id, aud: AUD, tenant_id: getTenantId() });
    return { ...tokens, user: presentStoreCustomer(customer) };
  }

  async register({ name, email, password, phone, accepts_marketing }) {
    const existing = await this.repo.findByEmail(email);
    let customer;
    if (existing?.password_hash) throw new ConflictError('An account with this email already exists', [{ path: 'email', message: 'Email is already registered' }]);
    const password_hash = await hashPassword(password);
    if (existing) {
      // Guest who checked out before: upgrade to a full account.
      customer = await this.repo.update(existing.id, { name, password_hash, phone: phone ?? existing.phone, accepts_marketing: accepts_marketing ?? existing.accepts_marketing });
    } else {
      customer = await this.repo.create({ name, email, password_hash, phone: phone || null, accepts_marketing: Boolean(accepts_marketing), addresses: [] });
    }
    const general = await this.settings.getGroup(getTenantId(), 'general');
    enqueueEmail('customer.welcome', { customer: presentStoreCustomer(customer), store_name: general.store_name || getTenant()?.name });
    return this.issue(customer);
  }

  async login({ email, password }) {
    const customer = await this.repo.findByEmail(email);
    if (!customer || !(await verifyPassword(password, customer.password_hash))) throw new UnauthenticatedError('Invalid email or password');
    if (customer.status !== 'active') throw new UnauthenticatedError('This account has been disabled');
    return this.issue(customer);
  }

  async refresh({ refresh_token }) {
    const decoded = await consumeRefreshToken(refresh_token, AUD);
    if (decoded.tenant_id !== getTenantId()) throw new UnauthenticatedError('Token does not belong to this store');
    const customer = await this.repo.findById(decoded.sub);
    if (!customer || customer.status !== 'active') throw new UnauthenticatedError('Account is disabled or no longer exists');
    return this.issue(customer);
  }

  async logout({ refresh_token }) {
    if (refresh_token) await revokeRefreshToken(refresh_token, AUD);
    return { logged_out: true };
  }

  async me(customerId) {
    return presentStoreCustomer(await this.repo.findById(customerId));
  }

  async updateMe(customerId, data) {
    const patch = {};
    for (const key of ['name', 'phone', 'addresses', 'accepts_marketing']) if (data[key] !== undefined) patch[key] = data[key];
    if (data.password) patch.password_hash = await hashPassword(data.password);
    return presentStoreCustomer(await this.repo.update(customerId, patch));
  }
}
