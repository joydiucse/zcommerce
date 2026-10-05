import { NotFoundError } from '../../../shared/exceptions/index.js';

export class ReviewService {
  constructor({ reviewRepository }) {
    this.repo = reviewRepository;
  }

  present(row) {
    const { product_name, product_slug, customer_email, ...r } = row;
    return { ...r, product: { id: r.product_id, name: product_name, slug: product_slug }, customer_email: customer_email || null };
  }

  async list(query) {
    const { data, meta } = await this.repo.list(query);
    return { data: data.map((r) => this.present(r)), meta };
  }

  async get(id) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError('Review not found');
    return this.present(row);
  }

  async update(id, { status }) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Review not found');
    await this.repo.update(id, { status });
    await this.repo.recomputeRating(existing.product_id);
    return this.get(id);
  }

  async remove(id) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Review not found');
    await this.repo.delete(id);
    await this.repo.recomputeRating(existing.product_id);
    return { id };
  }
}
