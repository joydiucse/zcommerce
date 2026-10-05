import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { closeConnections } from '../../src/app/database/connection.js';

// Requires a migrated + seeded database (npm run migrate && npm run seed).
const app = createApp();
afterAll(() => closeConnections());

describe('health', () => {
  it('GET /health reports db status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('up');
    expect(res.headers['x-request-id']).toBeTruthy();
  });

  it('GET /api/v1/health uses the same handler', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.data.db).toBe('up');
  });
});

describe('store products', () => {
  it('lists active products for the X-Tenant store with pagination meta', async () => {
    const res = await request(app).get('/api/v1/store/products?limit=5&sort=price_asc').set('X-Tenant', 'demo');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(5);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 5 });
    expect(res.body.meta.total).toBeGreaterThan(5);
    const prices = res.body.data.map((p) => p.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    const p = res.body.data[0];
    expect(typeof p.price).toBe('number');
    expect(p).toHaveProperty('in_stock');
    expect(p).toHaveProperty('images');
  });

  it('returns TENANT_NOT_FOUND for an unknown store', async () => {
    const res = await request(app).get('/api/v1/store/products').set('X-Tenant', 'does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('TENANT_NOT_FOUND');
  });

  it('returns 422 VALIDATION_ERROR with details for bad filters', async () => {
    const res = await request(app).get('/api/v1/store/products?sort=bogus').set('X-Tenant', 'demo');
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0].path).toBe('query.sort');
  });
});
