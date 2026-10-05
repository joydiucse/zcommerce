import { db } from '../database/connection.js';
import { getTenantId } from './tenant-context.js';

/**
 * Tenant isolation lives here. Every tenant-owned query goes through `scoped()` (adds
 * `where <table>.tenant_id = ?`) and every insert through `scopedInsert()` (forces tenant_id).
 */
export function scoped(table, trx = null, tenantId = getTenantId()) {
  const name = String(table).split(/\s+as\s+/i).pop().trim();
  return (trx || db)(table).where(`${name}.tenant_id`, tenantId);
}

export function withTenantId(data, tenantId = getTenantId()) {
  if (Array.isArray(data)) return data.map((row) => ({ ...row, tenant_id: tenantId }));
  return { ...data, tenant_id: tenantId };
}

export function scopedInsert(table, data, trx = null, tenantId = getTenantId()) {
  return (trx || db)(table).insert(withTenantId(data, tenantId)).returning('*');
}

/** Serialize jsonb columns (pg would otherwise send JS arrays as PG arrays). */
export function serializeJson(data, jsonColumns = []) {
  const out = { ...data };
  for (const col of jsonColumns) {
    if (out[col] !== undefined && out[col] !== null && typeof out[col] !== 'string') out[col] = JSON.stringify(out[col]);
  }
  return out;
}

/**
 * Base repository for tenant-owned tables. Subclasses set `table`, `jsonColumns`.
 */
export class TenantRepository {
  constructor({ table, jsonColumns = [] }) {
    this.table = table;
    this.jsonColumns = jsonColumns;
  }

  query(trx = null) {
    return scoped(this.table, trx);
  }

  async findById(id, trx = null) {
    return this.query(trx).where(`${this.table}.id`, id).first();
  }

  async findBy(where, trx = null) {
    return this.query(trx).where(where).first();
  }

  async create(data, trx = null) {
    const [row] = await scopedInsert(this.table, serializeJson(data, this.jsonColumns), trx);
    return row;
  }

  async update(id, data, trx = null) {
    const [row] = await this.query(trx)
      .where(`${this.table}.id`, id)
      .update({ ...serializeJson(data, this.jsonColumns), updated_at: db.fn.now() })
      .returning('*');
    return row;
  }

  async delete(id, trx = null) {
    return this.query(trx).where(`${this.table}.id`, id).del();
  }
}

/** Base repository for global (system-side) tables. */
export class GlobalRepository {
  constructor({ table, jsonColumns = [] }) {
    this.table = table;
    this.jsonColumns = jsonColumns;
  }

  query(trx = null) {
    return (trx || db)(this.table);
  }

  async findById(id, trx = null) {
    return this.query(trx).where(`${this.table}.id`, id).first();
  }

  async findBy(where, trx = null) {
    return this.query(trx).where(where).first();
  }

  async create(data, trx = null) {
    const [row] = await this.query(trx).insert(serializeJson(data, this.jsonColumns)).returning('*');
    return row;
  }

  async update(id, data, trx = null) {
    const [row] = await this.query(trx)
      .where('id', id)
      .update({ ...serializeJson(data, this.jsonColumns), updated_at: db.fn.now() })
      .returning('*');
    return row;
  }

  async delete(id, trx = null) {
    return this.query(trx).where('id', id).del();
  }
}
