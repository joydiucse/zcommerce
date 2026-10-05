import { presentStoreProduct } from '../products/product.service.js';

export class SearchService {
  constructor({ searchRepository, storeProductRepository }) {
    this.repo = searchRepository;
    this.products = storeProductRepository;
  }

  async search({ q = '', limit = 8 }) {
    const term = String(q).trim().replace(/[%_\\]/g, (c) => `\\${c}`);
    if (!term) return { products: [], categories: [], brands: [] };
    const [products, categories, brands] = await Promise.all([
      this.products.search(term, limit),
      this.repo.categories(term, Math.min(limit, 5)),
      this.repo.brands(term, Math.min(limit, 5)),
    ]);
    return { products: products.map(presentStoreProduct), categories, brands };
  }
}
