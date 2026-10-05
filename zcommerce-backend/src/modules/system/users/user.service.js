import { CrudService } from '../../../shared/helpers/crud.js';
import { hashPassword } from '../../../app/security/password.js';
import { ValidationError } from '../../../shared/exceptions/index.js';
import { omit } from '../../../shared/utils/index.js';

export class SystemUserService extends CrudService {
  constructor({ systemUserRepository, auditLogService }) {
    super(systemUserRepository, { entity: 'User' });
    this.audit = auditLogService;
  }

  present(row) {
    const { role_name, ...rest } = omit(row, ['password_hash']);
    return { ...rest, role: rest.role_id ? { id: rest.role_id, name: role_name } : null };
  }

  async prepare(data) {
    if (data.password) data.password_hash = await hashPassword(data.password);
    delete data.password;
    return data;
  }

  async create(data, req) {
    const user = await super.create(data);
    await this.audit.record(req, { action: 'system_user.created', entity_type: 'system_user', entity_id: user.id, changes: { name: user.name, email: user.email, role_id: user.role_id } });
    return user;
  }

  async update(id, data, req) {
    if (req?.user?.id === id && data.status === 'disabled') throw ValidationError.field('status', 'You cannot disable your own account');
    const user = await super.update(id, data);
    await this.audit.record(req, { action: 'system_user.updated', entity_type: 'system_user', entity_id: id, changes: omit(data, ['password']) });
    return user;
  }

  async remove(id, req) {
    if (req?.user?.id === id) throw ValidationError.field('id', 'You cannot delete your own account');
    const result = await super.remove(id);
    await this.audit.record(req, { action: 'system_user.deleted', entity_type: 'system_user', entity_id: id });
    return result;
  }
}
