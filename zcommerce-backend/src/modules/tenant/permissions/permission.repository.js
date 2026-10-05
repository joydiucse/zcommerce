import { TENANT_PERMISSION_GROUPS } from '../../../shared/constants/index.js';

/** Tenant permission keys are code-defined (see shared/constants/permissions.js). */
export class TenantPermissionRepository {
  groups() {
    return TENANT_PERMISSION_GROUPS;
  }
}
