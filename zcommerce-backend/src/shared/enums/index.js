export const TenantStatus = ['trial', 'active', 'suspended'];
export const UserStatus = ['active', 'disabled'];
export const SubscriptionStatus = ['trialing', 'active', 'past_due', 'canceled'];
export const BillingCycle = ['monthly', 'yearly'];
export const InvoiceStatus = ['draft', 'open', 'paid', 'void'];
export const ProductStatus = ['draft', 'active', 'archived'];
export const InventoryMovementType = ['adjustment', 'sale', 'return', 'restock'];
export const ShippingMethodType = ['flat', 'free', 'free_over'];
export const CouponType = ['percent', 'fixed', 'free_shipping'];
export const OrderStatus = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
export const PaymentStatus = ['pending', 'paid', 'failed', 'refunded'];
export const FulfillmentStatus = ['unfulfilled', 'fulfilled'];
export const PaymentMethod = ['cod', 'manual'];
export const ReviewStatus = ['pending', 'approved', 'rejected'];
export const ActorType = ['system', 'tenant'];
export const StockFilter = ['in', 'low', 'out'];
/** Orders in these statuses do not count toward revenue. */
export const NON_REVENUE_STATUSES = ['cancelled', 'refunded'];
