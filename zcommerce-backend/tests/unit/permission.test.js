import { describe, it, expect, afterAll } from 'vitest';
import { hasPermission, can } from '../../src/app/middleware/permission.middleware.js';
import { closeConnections } from '../../src/app/database/connection.js';

afterAll(() => closeConnections());

describe('hasPermission', () => {
  it('grants everything with the * wildcard', () => {
    expect(hasPermission(['*'], 'products.create')).toBe(true);
    expect(hasPermission(['*'], 'tenants.delete')).toBe(true);
  });

  it('matches exact keys only', () => {
    expect(hasPermission(['products.view'], 'products.view')).toBe(true);
    expect(hasPermission(['products.view'], 'products.create')).toBe(false);
    expect(hasPermission(['products.view'], 'product.view')).toBe(false);
  });

  it('supports resource wildcards', () => {
    expect(hasPermission(['products.*'], 'products.delete')).toBe(true);
    expect(hasPermission(['products.*'], 'orders.view')).toBe(false);
  });

  it('denies with no permissions', () => {
    expect(hasPermission([], 'users.create')).toBe(false);
    expect(hasPermission(undefined, 'users.create')).toBe(false);
  });
});

describe('can() middleware', () => {
  const run = (req, ...keys) =>
    new Promise((resolve) => {
      can(...keys)(req, {}, (err) => resolve(err || null));
    });

  it('passes when any listed permission is granted', async () => {
    expect(await run({ user: { id: 1 }, permissions: ['orders.view'] }, 'products.view', 'orders.view')).toBeNull();
  });

  it('returns FORBIDDEN when missing', async () => {
    const err = await run({ user: { id: 1 }, permissions: ['orders.view'] }, 'users.create');
    expect(err.status).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  it('returns UNAUTHENTICATED without a user', async () => {
    const err = await run({}, 'users.create');
    expect(err.code).toBe('UNAUTHENTICATED');
  });
});
