import { z, email, password, uuid, listQuery, idParams } from '../../../shared/validators/index.js';

const base = {
  name: z.string().trim().min(1).max(150),
  email,
  role_id: uuid,
  status: z.enum(['active', 'disabled']).default('active'),
};

export const listUsersSchema = { query: listQuery.extend({ status: z.enum(['active', 'disabled']).optional(), role_id: uuid.optional() }) };
export const createUserSchema = { body: z.object({ ...base, password }) };
export const updateUserSchema = {
  params: idParams,
  body: z.object({ ...base, status: base.status.optional(), password: password.optional() }).partial(),
};
export { idParams };
