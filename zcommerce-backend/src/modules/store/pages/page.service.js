import { NotFoundError } from '../../../shared/exceptions/index.js';

export class StorePageService {
  constructor({ storePageRepository }) {
    this.repo = storePageRepository;
  }

  async list() {
    return (await this.repo.published()).map(({ title, slug, show_in_footer }) => ({ title, slug, show_in_footer }));
  }

  async get(slug) {
    const page = await this.repo.findBySlug(slug);
    if (!page) throw new NotFoundError('Page not found');
    return page;
  }
}
