import { scoped } from '../../../app/tenant/tenant-scope.js';
import { db } from '../../../app/database/connection.js';

const COLUMNS = [
  'brands.id',
  'brands.name',
  'brands.slug',
  'brands.description',
  'brands.logo_url',
  'brands.meta_title',
  'brands.meta_description',
  'brands.updated_at',
  db.raw(`(select count(*) from products p where p.brand_id = brands.id and p.status = 'active')::int as product_count`),
];

export class StoreBrandRepository {
  all() {
    return scoped('brands').where('brands.is_active', true).select(COLUMNS).orderBy('brands.name');
  }

  findBySlug(slug) {
    return scoped('brands').where({ 'brands.slug': slug, 'brands.is_active': true }).select(COLUMNS).first();
  }
}
