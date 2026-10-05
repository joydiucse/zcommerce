import { sendMail } from '../../shared/utils/mailer.js';

const money = (n, currency = 'USD') => `${currency} ${Number(n || 0).toFixed(2)}`;

function orderTable(order) {
  const rows = (order.items || [])
    .map((i) => `<tr><td>${i.name}</td><td align="center">${i.quantity}</td><td align="right">${money(i.line_total, order.currency)}</td></tr>`)
    .join('');
  return `<table width="100%" cellpadding="6" style="border-collapse:collapse">
    <thead><tr><th align="left">Item</th><th>Qty</th><th align="right">Total</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr><td colspan="2" align="right">Subtotal</td><td align="right">${money(order.subtotal, order.currency)}</td></tr>
      <tr><td colspan="2" align="right">Discount</td><td align="right">-${money(order.discount_total, order.currency)}</td></tr>
      <tr><td colspan="2" align="right">Shipping</td><td align="right">${money(order.shipping_total, order.currency)}</td></tr>
      <tr><td colspan="2" align="right">Tax</td><td align="right">${money(order.tax_total, order.currency)}</td></tr>
      <tr><td colspan="2" align="right"><b>Total</b></td><td align="right"><b>${money(order.grand_total, order.currency)}</b></td></tr>
    </tfoot></table>`;
}

const templates = {
  'order.confirmation': ({ order, store_name }) => ({
    to: order.email,
    subject: `${store_name}: order #${order.order_number} received`,
    html: `<h2>Thanks for your order!</h2><p>We received order <b>#${order.order_number}</b> and will let you know when it ships.</p>${orderTable(order)}`,
  }),
  'order.admin': ({ order, store_name, to }) => ({
    to,
    subject: `[${store_name}] New order #${order.order_number} (${money(order.grand_total, order.currency)})`,
    html: `<h2>New order #${order.order_number}</h2><p>Customer: ${order.email}</p>${orderTable(order)}`,
  }),
  'order.status': ({ order, store_name }) => ({
    to: order.email,
    subject: `${store_name}: order #${order.order_number} is ${order.status}`,
    html: `<p>Your order <b>#${order.order_number}</b> is now <b>${order.status}</b>.</p>${order.tracking_number ? `<p>Tracking number: ${order.tracking_number}</p>` : ''}`,
  }),
  'customer.welcome': ({ customer, store_name }) => ({
    to: customer.email,
    subject: `Welcome to ${store_name}`,
    html: `<p>Hi ${customer.name}, thanks for creating an account at ${store_name}.</p>`,
  }),
  raw: (data) => data,
};

/** BullMQ processor for the `emails` queue. job.name selects the template. */
export async function processEmailJob(job) {
  const template = templates[job.name] || templates.raw;
  const message = template(job.data || {});
  if (!message?.to) return { skipped: true };
  const info = await sendMail(message);
  return { messageId: info?.messageId };
}

export default processEmailJob;
