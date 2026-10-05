import { NotFoundError } from '../../../shared/exceptions/index.js';

/** Store product list-item shape (CONTRACT.md §5 Store shapes). */
export function presentStoreProduct(p) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    short_description: p.short_description,
    price: p.price,
    compare_at_price: p.compare_at_price,
    images: p.images || [],
    category: p.category_id && p.category_name ? { id: p.category_id, name: p.category_name, slug: p.category_slug } : null,
    brand: p.brand_id && p.brand_name ? { id: p.brand_id, name: p.brand_name, slug: p.brand_slug } : null,
    in_stock: !p.track_inventory || p.stock_quantity > 0,
    stock_quantity: p.stock_quantity,
    is_featured: p.is_featured,
    rating_avg: p.rating_avg,
    rating_count: p.rating_count,
    published_at: p.published_at,
    updated_at: p.updated_at,
  };
}

export class StoreProductService {
  constructor({ storeProductRepository }) {
    this.repo = storeProductRepository;
  }

  async list(query) {
    const { data, meta } = await this.repo.list(query);
    return { data: data.map(presentStoreProduct), meta };
  }

  async get(slug) {
    const p = await this.repo.findBySlug(slug);
    if (!p) throw new NotFoundError('Product not found');
    const related = await this.repo.related(p, 4);
    return {
      ...presentStoreProduct(p),
      description: p.description,
      attributes: p.attributes || [],
      tags: p.tags || [],
      weight: p.weight,
      meta_title: p.meta_title,
      meta_description: p.meta_description,
      related: related.map(presentStoreProduct),
    };
  }
}
