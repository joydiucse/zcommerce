export class SystemPermissionService {
  constructor({ systemPermissionRepository }) {
    this.repo = systemPermissionRepository;
  }

  list() {
    return this.repo.groups().map((g) => ({ group: g.group, keys: [...g.keys] }));
  }
}
