import { z, listQuery, idParams, boolish } from '../../../shared/validators/index.js';

export const listNotificationsSchema = { query: listQuery.extend({ unread: boolish.optional(), type: z.string().max(50).optional() }) };
export { idParams };
