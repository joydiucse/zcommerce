export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

/**
 * Normalise list query params (page, limit, search, sort, order) against a whitelist of sortable columns.
 * `sortable` maps public sort keys -> SQL column (e.g. { created_at: 'products.created_at' }).
 */
export function parseListQuery(query = {}, { sortable = {}, defaultSort = 'created_at', defaultOrder = 'desc' } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT));
  const sortKey = Object.prototype.hasOwnProperty.call(sortable, query.sort) ? query.sort : defaultSort;
  const sortColumn = sortable[sortKey] || sortKey;
  const orderRaw = String(query.order || defaultOrder).toLowerCase();
  const order = orderRaw === 'asc' ? 'asc' : 'desc';
  const search = typeof query.search === 'string' ? query.search.trim() : '';
  return { page, limit, offset: (page - 1) * limit, sort: sortKey, sortColumn, order, search };
}

export function buildMeta({ page, limit, total }) {
  return { page, limit, total, total_pages: Math.max(1, Math.ceil(total / limit)) };
}

/**
 * Execute a paginated knex query. Counting uses a cloned query with ordering/selection cleared.
 * Returns { data, meta } in the contract format.
 */
/**
 * Apply search (ILIKE over `searchColumns`) + whitelisted sorting + pagination to a query.
 */
export async function paginateQuery(qb, query = {}, { sortable = {}, defaultSort = 'created_at', defaultOrder, searchColumns = [], countColumn } = {}) {
  const opts = parseListQuery(query, { sortable, defaultSort, defaultOrder });
  if (opts.search && searchColumns.length) {
    const term = `%${opts.search.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
    qb.where((b) => {
      searchColumns.forEach((col) => b.orWhereILike(col, term));
    });
  }
  return paginate(qb, opts, { countColumn });
}

export async function paginate(qb, { page, limit, offset, sortColumn, order }, { countColumn } = {}) {
  const countQb = qb.clone().clearSelect().clearOrder();
  const [{ count }] = await countQb.countDistinct({ count: countColumn || `${qb._single.table}.id` });
  let dataQb = qb.clone();
  if (sortColumn && typeof sortColumn === 'object' && typeof sortColumn.toSQL === 'function') {
    dataQb = dataQb.orderByRaw(`${sortColumn.toSQL().sql} ${order}`);
  } else if (sortColumn) {
    dataQb = dataQb.orderBy(sortColumn, order);
  }
  if (sortColumn) dataQb = dataQb.orderBy(`${qb._single.table}.id`, 'asc');
  const data = await dataQb.limit(limit).offset(offset);
  return { data, meta: buildMeta({ page, limit, total: Number(count) }) };
}
