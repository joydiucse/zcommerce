/**
 * Shared JSDoc typedefs (documentation only; the project is plain JavaScript).
 *
 * @typedef {{ id: string, name: string, slug: string, status: 'trial'|'active'|'suspended', custom_domain: string|null, email: string, plan_id: string|null }} Tenant
 * @typedef {{ sub: string, aud: 'system'|'tenant'|'customer', tenant_id?: string, role_id?: string, type: 'access'|'refresh', jti?: string }} TokenPayload
 * @typedef {{ name: string, phone: string, line1: string, line2: string, city: string, state: string, postal_code: string, country: string }} Address
 * @typedef {{ page: number, limit: number, total: number, total_pages: number }} PageMeta
 * @typedef {{ price: number, quantity: number }} TotalsItem
 * @typedef {{ type: 'percent'|'fixed'|'free_shipping', value: number, max_discount?: number|null }} TotalsCoupon
 * @typedef {{ type: 'flat'|'free'|'free_over', rate: number, free_over_amount?: number|null }} TotalsShipping
 */
export {};
