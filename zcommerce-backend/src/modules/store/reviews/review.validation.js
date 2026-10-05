import { z } from '../../../shared/validators/index.js';

export const listReviewsSchema = {
  query: z
    .object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
      sort: z.enum(['created_at', 'rating']).optional(),
      order: z.enum(['asc', 'desc']).optional(),
    })
    .passthrough(),
};

export const createReviewSchema = {
  body: z.object({
    rating: z.coerce.number().int().min(1).max(5),
    title: z.string().trim().max(255).optional().nullable(),
    body: z.string().trim().max(5000).optional().nullable(),
    author_name: z.string().trim().min(1).max(150).optional(),
  }),
};
