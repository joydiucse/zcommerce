export class TenantPermissionService {
  constructor({ tenantPermissionRepository }) {
    this.repo = tenantPermissionRepository;
  }

  list() {
    return this.repo.groups().map((g) => ({ group: g.group, keys: [...g.keys] }));
  }
}
