import { z } from '../../../shared/validators/index.js';

const date = z
  .string()
  .max(40)
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date');

const range = { from: date.optional(), to: date.optional() };

export const salesReportSchema = { query: z.object({ ...range, group_by: z.enum(['day', 'week', 'month']).default('day') }) };
export const topReportSchema = { query: z.object({ ...range, limit: z.coerce.number().int().min(1).max(100).default(20) }) };
