import { z } from '../../../shared/validators/index.js';

export const searchSchema = {
  query: z.object({
    q: z.string().max(200).optional().default(''),
    limit: z.coerce.number().int().min(1).max(50).default(8),
  }),
};
