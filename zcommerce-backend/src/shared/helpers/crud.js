import { NotFoundError } from '../exceptions/index.js';
import { ok, created } from './response.js';
import { slugify } from '../utils/index.js';

/**
 * Minimal CRUD service on top of a repository exposing list/findById/create/update/delete.
 * Subclasses override `prepare(data, existing)` to normalise input (slugs, etc.) and `present(row)`.
 */
export class CrudService {
  constructor(repository, { entity = 'Resource', slugFrom = null } = {}) {
    this.repo = repository;
    this.entity = entity;
    this.slugFrom = slugFrom;
  }

  async prepare(data, existing = null) {
    if (this.slugFrom && data[this.slugFrom] !== undefined && !data.slug && !existing) data.slug = slugify(data[this.slugFrom]);
    if (data.slug) data.slug = slugify(data.slug);
    return data;
  }

  present(row) {
    return row;
  }

  async list(query) {
    const result = await this.repo.list(query);
    return { data: result.data.map((r) => this.present(r)), meta: result.meta };
  }

  async get(id) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError(`${this.entity} not found`);
    return this.present(row);
  }

  async create(data) {
    const row = await this.repo.create(await this.prepare({ ...data }));
    return this.get(row.id);
  }

  async update(id, data) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError(`${this.entity} not found`);
    await this.repo.update(id, await this.prepare({ ...data }, existing));
    return this.get(id);
  }

  async remove(id) {
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new NotFoundError(`${this.entity} not found`);
    return { id };
  }
}

/** Thin controller mapping HTTP to a CrudService. Methods are bound (safe to pass to routers). */
export class CrudController {
  constructor(service) {
    this.service = service;
    this.list = async (req, res) => {
      const { data, meta } = await this.service.list(req.query);
      return ok(res, data, meta);
    };
    this.show = async (req, res) => ok(res, await this.service.get(req.params.id));
    this.create = async (req, res) => created(res, await this.service.create(req.body, req));
    this.update = async (req, res) => ok(res, await this.service.update(req.params.id, req.body, req));
    this.destroy = async (req, res) => ok(res, await this.service.remove(req.params.id, req));
  }
}
