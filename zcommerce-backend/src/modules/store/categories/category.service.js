import { NotFoundError } from '../../../shared/exceptions/index.js';

/** Build a nested tree; product_count includes descendants. */
export function buildCategoryTree(rows) {
  const nodes = new Map(
    rows.map((r) => [
      r.id,
      { id: r.id, parent_id: r.parent_id, name: r.name, slug: r.slug, image_url: r.image_url, product_count: r.direct_count, children: [] },
    ]),
  );
  const roots = [];
  for (const node of nodes.values()) {
    const parent = node.parent_id ? nodes.get(node.parent_id) : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  const total = (n) => {
    n.product_count = n.product_count + n.children.reduce((s, c) => s + total(c), 0);
    return n.product_count;
  };
  roots.forEach(total);
  return roots;
}

export class StoreCategoryService {
  constructor({ storeCategoryRepository }) {
    this.repo = storeCategoryRepository;
  }

  async tree() {
    return buildCategoryTree(await this.repo.allActive());
  }

  async get(slug) {
    const rows = await this.repo.allActive();
    const tree = buildCategoryTree(rows);
    const byId = new Map(rows.map((r) => [r.id, r]));
    const row = rows.find((r) => r.slug === slug);
    if (!row) throw new NotFoundError('Category not found');

    const breadcrumbs = [];
    for (let cur = row; cur; cur = cur.parent_id ? byId.get(cur.parent_id) : null) {
      breadcrumbs.unshift({ name: cur.name, slug: cur.slug });
    }
    const find = (nodes) => {
      for (const n of nodes) {
        if (n.id === row.id) return n;
        const hit = find(n.children);
        if (hit) return hit;
      }
      return null;
    };
    const node = find(tree);
    return {
      id: row.id,
      parent_id: row.parent_id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      image_url: row.image_url,
      meta_title: row.meta_title,
      meta_description: row.meta_description,
      product_count: node?.product_count ?? row.direct_count,
      children: node?.children ?? [],
      breadcrumbs,
      updated_at: row.updated_at,
    };
  }
}
