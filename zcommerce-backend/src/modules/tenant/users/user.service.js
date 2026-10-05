import { CrudService } from '../../../shared/helpers/crud.js';
import { hashPassword } from '../../../app/security/password.js';
import { scoped } from '../../../app/tenant/tenant-scope.js';
import { getTenant } from '../../../app/tenant/tenant-context.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../shared/exceptions/index.js';
import { omit } from '../../../shared/utils/index.js';

export class TenantUserService extends CrudService {
  constructor({ tenantUserRepository }) {
    super(tenantUserRepository, { entity: 'User' });
  }

  present(row) {
    const { role_name, ...rest } = omit(row, ['password_hash']);
    return { ...rest, role: rest.role_id ? { id: rest.role_id, name: role_name } : null };
  }

  async prepare(data) {
    if (data.role_id) {
      const role = await scoped('roles').where('roles.id', data.role_id).first();
      if (!role) throw ValidationError.field('role_id', 'Role not found');
    }
    if (data.password) data.password_hash = await hashPassword(data.password);
    delete data.password;
    return data;
  }

  isOwner(id) {
    return getTenant()?.owner_id === id;
  }

  async update(id, data, req) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('User not found');
    if (this.isOwner(id) && (data.status === 'disabled' || (data.role_id && data.role_id !== existing.role_id))) {
      throw new ForbiddenError('The store owner cannot be disabled or have their role changed');
    }
    if (req?.user?.id === id && data.status === 'disabled') throw ValidationError.field('status', 'You cannot disable your own account');
    return super.update(id, data);
  }

  async remove(id, req) {
    if (this.isOwner(id)) throw new ForbiddenError('The store owner cannot be deleted');
    if (req?.user?.id === id) throw ValidationError.field('id', 'You cannot delete your own account');
    return super.remove(id);
  }
}
