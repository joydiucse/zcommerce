import { round2 } from '../../../shared/utils/index.js';
import { resolveRange } from './report.service.js';

/** Tenant dashboard (lives with reports per the module layout). */
export class DashboardService {
  constructor({ reportRepository }) {
    this.repo = reportRepository;
  }

  async overview() {
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const range = resolveRange(null, null, 30);

    const [counters, series, top, recent] = await Promise.all([
      this.repo.dashboardCounters(todayStart, monthStart),
      this.repo.salesSeries(range.from, range.to, 'day'),
      this.repo.topProducts(range.from, range.to, 5),
      this.repo.recentOrders(8),
    ]);

    return {
      revenue_today: round2(counters.revenue_today),
      revenue_month: round2(counters.revenue_month),
      orders_today: counters.orders_today,
      orders_month: counters.orders_month,
      customers_total: counters.customers_total,
      products_total: counters.products_total,
      low_stock_count: counters.low_stock_count,
      pending_orders: counters.pending_orders,
      sales_chart: series.map((s) => ({ date: s.period, revenue: round2(s.revenue), orders: s.orders })),
      top_products: top.map((p) => ({ id: p.id, name: p.name, quantity: p.quantity, revenue: round2(p.revenue) })),
      recent_orders: recent.map(({ customer_name, ...o }) => ({ ...o, customer_name: customer_name || null })),
    };
  }
}
