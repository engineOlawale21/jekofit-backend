import { OrderService } from './order.service';

describe('OrderService tracking', () => {
  const orders: any = { findOne: jest.fn() };
  const tracking: any = { find: jest.fn() };
  const service = new OrderService(orders, tracking);

  it('returns events chronologically after checking order ownership', async () => {
    orders.findOne.mockResolvedValue({ id: 'order-1', userId: 'user-1', items: [] });
    tracking.find.mockResolvedValue([]);
    await service.trackingForUser('user-1', 'JF-1');
    expect(orders.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user-1', orderNumber: 'JF-1' } }));
    expect(tracking.find).toHaveBeenCalledWith({ where: { orderId: 'order-1' }, order: { occurredAt: 'ASC' } });
  });
});
