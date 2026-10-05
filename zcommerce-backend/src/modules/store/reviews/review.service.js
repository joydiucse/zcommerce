import { NotFoundError, ValidationError } from '../../../shared/exceptions/index.js';

export class StoreReviewService {
  constructor({ storeReviewRepository, notificationService }) {
    this.repo = storeReviewRepository;
    this.notifications = notificationService;
  }

  async list(slug, query) {
    const product = await this.repo.findActiveProduct(slug);
    if (!product) throw new NotFoundError('Product not found');
    return this.repo.approved(product.id, query);
  }

  async create(slug, body, customer) {
    const product = await this.repo.findActiveProduct(slug);
    if (!product) throw new NotFoundError('Product not found');
    const author = body.author_name || customer?.name;
    if (!author) throw ValidationError.field('author_name', 'Your name is required');
    const review = await this.repo.create({
      product_id: product.id,
      customer_id: customer?.id || null,
      author_name: author,
      rating: body.rating,
      title: body.title || null,
      body: body.body || null,
      status: 'pending',
    });
    await this.notifications.notify({
      type: 'review.created',
      title: `New ${body.rating}-star review on ${product.name}`,
      body: body.title || (body.body || '').slice(0, 140),
      data: { review_id: review.id, product_id: product.id },
    });
    return {
      id: review.id,
      author_name: review.author_name,
      rating: review.rating,
      title: review.title,
      body: review.body,
      status: review.status,
      created_at: review.created_at,
    };
  }
}
