import { z, listQuery, idParams } from '../../../shared/validators/index.js';
import { TENANT_PERMISSIONS } from '../../../shared/constants/index.js';

const permissionKey = z.string().refine((k) => k === '*' || TENANT_PERMISSIONS.includes(k) || /^[a-z_]+\.\*$/.test(k), {
  message: 'Unknown permission key',
});

const body = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().max(1000).nullable().optional(),
  permissions: z.array(permissionKey).default([]),
});

export const listRolesSchema = { query: listQuery };
export const createRoleSchema = { body };
export const updateRoleSchema = { params: idParams, body: body.partial() };
export { idParams };
