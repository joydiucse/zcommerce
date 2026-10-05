import { round2 } from '../../../shared/utils/index.js';

const DAY = 86400000;

/** Resolve ?from&to (YYYY-MM-DD or ISO) to [from, toExclusive). Default: last 30 days including today. */
export function resolveRange(from, to, defaultDays = 30) {
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  let end = to ? new Date(to) : new Date(todayStart.getTime() + DAY);
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(String(to))) end = new Date(end.getTime() + DAY);
  const start = from ? new Date(from) : new Date(todayStart.getTime() - (defaultDays - 1) * DAY);
  return { from: start.toISOString(), to: end.toISOString() };
}

export class ReportService {
  constructor({ reportRepository }) {
    this.repo = reportRepository;
  }

  async sales({ from, to, group_by = 'day' }) {
    const range = resolveRange(from, to);
    const [summary, series] = await Promise.all([this.repo.salesSummary(range.from, range.to), this.repo.salesSeries(range.from, range.to, group_by)]);
    return {
      from: range.from,
      to: range.to,
      group_by,
      summary: {
        revenue: round2(summary.revenue),
        orders: summary.orders,
        average_order_value: summary.orders ? round2(summary.revenue / summary.orders) : 0,
        items_sold: summary.items_sold,
      },
      series: series.map((s) => ({ period: s.period, revenue: round2(s.revenue), orders: s.orders })),
    };
  }

  async products({ from, to, limit = 20 }) {
    const range = resolveRange(from, to);
    return (await this.repo.topProducts(range.from, range.to, limit)).map((r) => ({ ...r, revenue: round2(r.revenue) }));
  }

  async customers({ from, to, limit = 20 }) {
    const range = resolveRange(from, to);
    return (await this.repo.topCustomers(range.from, range.to, limit)).map((r) => ({ ...r, revenue: round2(r.revenue) }));
  }
}
