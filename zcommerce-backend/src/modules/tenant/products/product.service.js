import { CrudService } from '../../../shared/helpers/crud.js';
import { withTransaction } from '../../../app/database/transaction.js';
import { NotFoundError, ValidationError } from '../../../shared/exceptions/index.js';
import { slugify } from '../../../shared/utils/index.js';

export function presentProduct(row) {
  if (!row) return row;
  const { category_name, category_slug, brand_name, brand_slug, ...p } = row;
  return {
    ...p,
    category: p.category_id ? { id: p.category_id, name: category_name, slug: category_slug } : null,
    brand: p.brand_id ? { id: p.brand_id, name: brand_name, slug: brand_slug } : null,
    in_stock: !p.track_inventory || p.stock_quantity > 0,
  };
}

export class ProductService extends CrudService {
  constructor({ productRepository }) {
    super(productRepository, { entity: 'Product', slugFrom: 'name' });
  }

  present(row) {
    return presentProduct(row);
  }

  async prepare(data, existing = null) {
    await super.prepare(data, existing);
    if (!existing && !data.slug) data.slug = slugify(data.name);
    if (data.category_id && !(await this.repo.categoryExists(data.category_id))) throw ValidationError.field('category_id', 'Category not found');
    if (data.brand_id && !(await this.repo.brandExists(data.brand_id))) throw ValidationError.field('brand_id', 'Brand not found');
    if (data.sku === '') data.sku = null;
    const status = data.status ?? existing?.status;
    if (status === 'active' && !existing?.published_at && !data.published_at) data.published_at = new Date();
    return data;
  }

  async create(data, req) {
    const prepared = await this.prepare({ ...data });
    const row = await withTransaction(async (trx) => {
      const product = await this.repo.create(prepared, trx);
      if (product.track_inventory && product.stock_quantity > 0) {
        await this.repo.addMovement(
          { product_id: product.id, type: 'restock', quantity: product.stock_quantity, reason: 'Initial stock', created_by: req?.user?.id || null },
          trx,
        );
      }
      return product;
    });
    return this.get(row.id);
  }

  async update(id, data, req) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Product not found');
    const prepared = await this.prepare({ ...data }, existing);
    await withTransaction(async (trx) => {
      await this.repo.update(id, prepared, trx);
      if (prepared.stock_quantity !== undefined && prepared.stock_quantity !== existing.stock_quantity) {
        await this.repo.addMovement(
          {
            product_id: id,
            type: 'adjustment',
            quantity: prepared.stock_quantity - existing.stock_quantity,
            reason: 'Product edit',
            created_by: req?.user?.id || null,
          },
          trx,
        );
      }
    });
    return this.get(id);
  }

  async bulk({ ids, action }) {
    const affected = await this.repo.bulk(ids, action);
    return { action, affected };
  }
}
