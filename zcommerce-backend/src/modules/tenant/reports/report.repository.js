import { db } from '../../../app/database/connection.js';
import { getTenantId } from '../../../app/tenant/tenant-context.js';
import { NON_REVENUE_STATUSES } from '../../../shared/enums/index.js';

const REVENUE_FILTER = `o.status not in (${NON_REVENUE_STATUSES.map((s) => `'${s}'`).join(',')})`;

export class ReportRepository {
  async salesSummary(from, to) {
    const { rows } = await db.raw(
      `select coalesce(sum(o.grand_total), 0) as revenue,
              count(*)::int as orders,
              coalesce((select sum(oi.quantity) from order_items oi join orders o2 on o2.id = oi.order_id
                        where o2.tenant_id = :t and o2.placed_at >= :from and o2.placed_at < :to
                          and o2.status not in (${NON_REVENUE_STATUSES.map((s) => `'${s}'`).join(',')})), 0)::int as items_sold
         from orders o
        where o.tenant_id = :t and o.placed_at >= :from and o.placed_at < :to and ${REVENUE_FILTER}`,
      { t: getTenantId(), from, to },
    );
    return rows[0];
  }

  async salesSeries(from, to, groupBy) {
    const unit = { day: 'day', week: 'week', month: 'month' }[groupBy] || 'day';
    const fmt = unit === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD';
    const { rows } = await db.raw(
      `select to_char(p, '${fmt}') as period,
              coalesce(sum(o.grand_total), 0) as revenue,
              count(o.id)::int as orders
         from generate_series(date_trunc('${unit}', :from::timestamptz at time zone 'UTC'),
                              date_trunc('${unit}', (:to::timestamptz - interval '1 second') at time zone 'UTC'),
                              interval '1 ${unit}') p
         left join orders o
           on o.tenant_id = :t and ${REVENUE_FILTER}
          and date_trunc('${unit}', o.placed_at at time zone 'UTC') = p
          and o.placed_at >= :from and o.placed_at < :to
        group by p order by p`,
      { t: getTenantId(), from, to },
    );
    return rows;
  }

  async topProducts(from, to, limit = 10) {
    const { rows } = await db.raw(
      `select coalesce(oi.product_id::text, oi.name) as key, oi.product_id as id, max(oi.name) as name, max(oi.sku) as sku,
              max(oi.image_url) as image_url,
              sum(oi.quantity)::int as quantity, coalesce(sum(oi.line_total), 0) as revenue, count(distinct o.id)::int as orders
         from order_items oi join orders o on o.id = oi.order_id
        where o.tenant_id = :t and o.placed_at >= :from and o.placed_at < :to and ${REVENUE_FILTER}
        group by key, oi.product_id
        order by quantity desc, revenue desc
        limit :limit`,
      { t: getTenantId(), from, to, limit },
    );
    return rows.map(({ key, ...r }) => r);
  }

  async topCustomers(from, to, limit = 10) {
    const { rows } = await db.raw(
      `select c.id, c.name, c.email, count(o.id)::int as orders, coalesce(sum(o.grand_total), 0) as revenue, max(o.placed_at) as last_order_at
         from orders o join customers c on c.id = o.customer_id
        where o.tenant_id = :t and o.placed_at >= :from and o.placed_at < :to and ${REVENUE_FILTER}
        group by c.id, c.name, c.email
        order by revenue desc
        limit :limit`,
      { t: getTenantId(), from, to, limit },
    );
    return rows;
  }

  // ----- dashboard -----
  async dashboardCounters(todayStart, monthStart) {
    const t = getTenantId();
    const { rows } = await db.raw(
      `select
         coalesce(sum(o.grand_total) filter (where o.placed_at >= :today and ${REVENUE_FILTER}), 0) as revenue_today,
         coalesce(sum(o.grand_total) filter (where o.placed_at >= :month and ${REVENUE_FILTER}), 0) as revenue_month,
         count(*) filter (where o.placed_at >= :today)::int as orders_today,
         count(*) filter (where o.placed_at >= :month)::int as orders_month,
         count(*) filter (where o.status = 'pending')::int as pending_orders
       from orders o where o.tenant_id = :t`,
      { t, today: todayStart, month: monthStart },
    );
    const [customers, products, lowStock] = await Promise.all([
      db('customers').where({ tenant_id: t }).count({ c: '*' }).first(),
      db('products').where({ tenant_id: t }).count({ c: '*' }).first(),
      db('products')
        .where({ tenant_id: t, track_inventory: true })
        .whereNot({ status: 'archived' })
        .whereRaw('stock_quantity <= low_stock_threshold')
        .count({ c: '*' })
        .first(),
    ]);
    return { ...rows[0], customers_total: customers.c, products_total: products.c, low_stock_count: lowStock.c };
  }

  recentOrders(limit = 8) {
    return db('orders')
      .leftJoin('customers', 'customers.id', 'orders.customer_id')
      .where('orders.tenant_id', getTenantId())
      .select(
        'orders.id',
        'orders.order_number',
        'orders.email',
        'orders.status',
        'orders.payment_status',
        'orders.grand_total',
        'orders.currency',
        'orders.placed_at',
        'orders.created_at',
        'customers.name as customer_name',
      )
      .orderBy('orders.placed_at', 'desc')
      .limit(limit);
  }
}
