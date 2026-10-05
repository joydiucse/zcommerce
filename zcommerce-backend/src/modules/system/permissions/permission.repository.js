import { SYSTEM_PERMISSION_GROUPS } from '../../../shared/constants/index.js';

/** Permissions are static (code-defined); the repository just exposes them. */
export class SystemPermissionRepository {
  groups() {
    return SYSTEM_PERMISSION_GROUPS;
  }
}
