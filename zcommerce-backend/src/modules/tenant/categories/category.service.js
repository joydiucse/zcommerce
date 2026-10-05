import { CrudService } from '../../../shared/helpers/crud.js';
import { ValidationError } from '../../../shared/exceptions/index.js';

export class CategoryService extends CrudService {
  constructor({ categoryRepository }) {
    super(categoryRepository, { entity: 'Category', slugFrom: 'name' });
  }

  present(row) {
    const { parent_name, ...c } = row;
    return { ...c, parent: c.parent_id ? { id: c.parent_id, name: parent_name } : null };
  }

  async all() {
    return (await this.repo.all()).map((r) => this.present(r));
  }

  async prepare(data, existing = null) {
    await super.prepare(data, existing);
    if (data.parent_id) {
      if (existing && data.parent_id === existing.id) throw ValidationError.field('parent_id', 'A category cannot be its own parent');
      const parent = await this.repo.findById(data.parent_id);
      if (!parent) throw ValidationError.field('parent_id', 'Parent category not found');
      if (existing && (await this.repo.descendantIds(existing.id)).includes(data.parent_id)) {
        throw ValidationError.field('parent_id', 'A category cannot be moved under one of its own children');
      }
    }
    return data;
  }
}
