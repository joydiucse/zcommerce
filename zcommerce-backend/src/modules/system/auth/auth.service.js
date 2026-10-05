import { verifyPassword } from '../../../app/security/password.js';
import { issueTokenPair, consumeRefreshToken, revokeRefreshToken } from '../../../app/security/jwt.js';
import { UnauthenticatedError } from '../../../shared/exceptions/index.js';

const AUD = 'system';

export class SystemAuthService {
  constructor({ systemAuthRepository }) {
    this.repo = systemAuthRepository;
  }

  async presentUser(user) {
    const role = await this.repo.findRole(user.role_id);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      last_login_at: user.last_login_at,
      role: role ? { id: role.id, name: role.name } : null,
    };
  }

  async issue(user) {
    const tokens = await issueTokenPair({ sub: user.id, aud: AUD, role_id: user.role_id });
    return { ...tokens, user: await this.presentUser(user) };
  }

  async login({ email, password }) {
    const user = await this.repo.findUserByEmail(email);
    if (!user || !(await verifyPassword(password, user.password_hash))) throw new UnauthenticatedError('Invalid email or password');
    if (user.status !== 'active') throw new UnauthenticatedError('This account has been disabled');
    await this.repo.touchLogin(user.id);
    return this.issue({ ...user, last_login_at: new Date() });
  }

  async refresh({ refresh_token }) {
    const decoded = await consumeRefreshToken(refresh_token, AUD);
    const user = await this.repo.findUserById(decoded.sub);
    if (!user || user.status !== 'active') throw new UnauthenticatedError('Account is disabled or no longer exists');
    return this.issue(user);
  }

  async logout({ refresh_token }) {
    if (refresh_token) await revokeRefreshToken(refresh_token, AUD);
    return { logged_out: true };
  }

  async me(user, permissions) {
    return { user: await this.presentUser(user), permissions };
  }
}
