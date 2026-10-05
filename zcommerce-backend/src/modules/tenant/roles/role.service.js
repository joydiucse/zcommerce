import { CrudService } from '../../../shared/helpers/crud.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../../shared/exceptions/index.js';
import { invalidateRolePermissions } from '../../../app/middleware/permission.middleware.js';

export class TenantRoleService extends CrudService {
  constructor({ tenantRoleRepository }) {
    super(tenantRoleRepository, { entity: 'Role' });
  }

  create(data) {
    return super.create({ ...data, is_system: false });
  }

  async update(id, data) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Role not found');
    if (existing.is_system && existing.name === 'Owner' && (data.permissions || data.name)) {
      throw new ForbiddenError('The Owner role cannot be modified');
    }
    delete data.is_system;
    const role = await super.update(id, data);
    await invalidateRolePermissions('tenant', id);
    return role;
  }

  async remove(id) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Role not found');
    if (existing.is_system) throw new ForbiddenError('Default roles cannot be deleted');
    if (existing.users_count > 0) throw new ConflictError('This role is assigned to users and cannot be deleted');
    const result = await super.remove(id);
    await invalidateRolePermissions('tenant', id);
    return result;
  }
}
