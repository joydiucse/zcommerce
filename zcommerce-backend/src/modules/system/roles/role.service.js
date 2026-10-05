import { CrudService } from '../../../shared/helpers/crud.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../../shared/exceptions/index.js';
import { invalidateRolePermissions } from '../../../app/middleware/permission.middleware.js';

export class SystemRoleService extends CrudService {
  constructor({ systemRoleRepository, auditLogService }) {
    super(systemRoleRepository, { entity: 'Role' });
    this.audit = auditLogService;
  }

  async create(data, req) {
    const role = await super.create({ ...data, is_system: false });
    await this.audit.record(req, { action: 'system_role.created', entity_type: 'system_role', entity_id: role.id, changes: data });
    return role;
  }

  async update(id, data, req) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Role not found');
    if (existing.is_system && data.permissions && !data.permissions.includes('*') && existing.permissions.includes('*')) {
      throw new ForbiddenError('The Super Admin role must keep full access');
    }
    delete data.is_system;
    const role = await super.update(id, data);
    await invalidateRolePermissions('system', id);
    await this.audit.record(req, { action: 'system_role.updated', entity_type: 'system_role', entity_id: id, changes: data });
    return role;
  }

  async remove(id, req) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Role not found');
    if (existing.is_system) throw new ForbiddenError('System roles cannot be deleted');
    if (existing.users_count > 0) throw new ConflictError('This role is assigned to users and cannot be deleted');
    const result = await super.remove(id);
    await invalidateRolePermissions('system', id);
    await this.audit.record(req, { action: 'system_role.deleted', entity_type: 'system_role', entity_id: id });
    return result;
  }
}
