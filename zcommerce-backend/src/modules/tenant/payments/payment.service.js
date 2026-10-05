export class PaymentService {
  constructor({ paymentRepository }) {
    this.repo = paymentRepository;
  }

  async list(query) {
    const { data, meta } = await this.repo.list(query);
    return {
      data: data.map(({ order_number, order_email, order_status, ...p }) => ({
        ...p,
        order: { id: p.order_id, order_number, email: order_email, status: order_status },
      })),
      meta,
    };
  }
}
