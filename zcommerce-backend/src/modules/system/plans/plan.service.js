import { CrudService } from '../../../shared/helpers/crud.js';
import { ConflictError, NotFoundError } from '../../../shared/exceptions/index.js';

export class PlanService extends CrudService {
  constructor({ planRepository, auditLogService }) {
    super(planRepository, { entity: 'Plan', slugFrom: 'name' });
    this.audit = auditLogService;
  }

  async create(data, req) {
    const plan = await super.create(data);
    await this.audit.record(req, { action: 'plan.created', entity_type: 'plan', entity_id: plan.id, changes: data });
    return plan;
  }

  async update(id, data, req) {
    const plan = await super.update(id, data);
    await this.audit.record(req, { action: 'plan.updated', entity_type: 'plan', entity_id: id, changes: data });
    return plan;
  }

  async remove(id, req) {
    const plan = await this.repo.findById(id);
    if (!plan) throw new NotFoundError('Plan not found');
    if (plan.tenants_count > 0) throw new ConflictError('This plan is used by tenants; deactivate it instead');
    const result = await super.remove(id);
    await this.audit.record(req, { action: 'plan.deleted', entity_type: 'plan', entity_id: id, changes: { name: plan.name } });
    return result;
  }
}
