import { verifyPassword, hashPassword } from '../../../app/security/password.js';
import { issueTokenPair, consumeRefreshToken, revokeRefreshToken } from '../../../app/security/jwt.js';
import { resolveTenantBySlug, resolveTenantById } from '../../../app/tenant/tenant-resolver.js';
import { loadRolePermissions } from '../../../app/middleware/permission.middleware.js';
import { TenantNotFoundError, TenantSuspendedError, UnauthenticatedError, ValidationError } from '../../../shared/exceptions/index.js';

const AUD = 'tenant';

export const presentTenant = (t) => ({ id: t.id, name: t.name, slug: t.slug, status: t.status, custom_domain: t.custom_domain, site_url: t.site_url ?? null });

export class TenantAuthService {
  constructor({ tenantAuthRepository }) {
    this.repo = tenantAuthRepository;
  }

  async presentUser(tenantId, user) {
    const role = await this.repo.findRole(tenantId, user.role_id);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url,
      status: user.status,
      last_login_at: user.last_login_at,
      role: role ? { id: role.id, name: role.name } : null,
    };
  }

  assertTenant(tenant) {
    if (!tenant) throw new TenantNotFoundError();
    if (tenant.status === 'suspended') throw new TenantSuspendedError();
  }

  async issue(tenant, user) {
    const tokens = await issueTokenPair({ sub: user.id, aud: AUD, tenant_id: tenant.id, role_id: user.role_id });
    return { ...tokens, user: await this.presentUser(tenant.id, user), tenant: presentTenant(tenant) };
  }

  async login({ tenant: slug, email, password }) {
    const tenant = await resolveTenantBySlug(slug);
    this.assertTenant(tenant);
    const user = await this.repo.findUserByEmail(tenant.id, email);
    if (!user || !(await verifyPassword(password, user.password_hash))) throw new UnauthenticatedError('Invalid email or password');
    if (user.status !== 'active') throw new UnauthenticatedError('This account has been disabled');
    await this.repo.touchLogin(tenant.id, user.id);
    return this.issue(tenant, { ...user, last_login_at: new Date() });
  }

  async refresh({ refresh_token }) {
    const decoded = await consumeRefreshToken(refresh_token, AUD);
    const tenant = await resolveTenantById(decoded.tenant_id);
    this.assertTenant(tenant);
    const user = await this.repo.findUserById(tenant.id, decoded.sub);
    if (!user || user.status !== 'active') throw new UnauthenticatedError('Account is disabled or no longer exists');
    return this.issue(tenant, user);
  }

  async logout({ refresh_token }) {
    if (refresh_token) await revokeRefreshToken(refresh_token, AUD);
    return { logged_out: true };
  }

  async me(tenant, user) {
    return {
      user: await this.presentUser(tenant.id, user),
      tenant: presentTenant(tenant),
      permissions: await loadRolePermissions('tenant', user.role_id),
    };
  }

  async updateProfile(tenant, user, { name, avatar_url }) {
    const data = {};
    if (name !== undefined) data.name = name;
    if (avatar_url !== undefined) data.avatar_url = avatar_url;
    const [updated] = await this.repo.updateUser(tenant.id, user.id, data);
    return this.presentUser(tenant.id, updated);
  }

  async changePassword(tenant, user, { current_password, password }) {
    const full = await this.repo.findUserById(tenant.id, user.id);
    if (!(await verifyPassword(current_password, full.password_hash))) {
      throw ValidationError.field('current_password', 'Current password is incorrect');
    }
    await this.repo.updateUser(tenant.id, user.id, { password_hash: await hashPassword(password) });
    return { updated: true };
  }
}
