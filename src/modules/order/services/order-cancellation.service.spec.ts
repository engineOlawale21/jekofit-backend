import { ConflictException, UnprocessableEntityException } from '@nestjs/common';
import { OrderStatus } from '../entities/order.entity';
import { OrderService } from './order.service';

describe('OrderService cancellation', () => {
  const orders: any = { findOne: jest.fn() };
  const cancellations: any = { findOne: jest.fn(), create: jest.fn((value) => value), save: jest.fn((value) => value) };
  const service = new OrderService(orders, cancellations);
  beforeEach(() => jest.clearAllMocks());

  it('accepts cancellation for a recently paid owned order', async () => {
    orders.findOne.mockResolvedValue({ id: 'order-1', status: OrderStatus.Paid, createdAt: new Date(), items: [] });
    cancellations.findOne.mockResolvedValue(null);
    await expect(service.requestCancellation('user-1', 'JF-1', ' Changed my mind ')).resolves.toEqual({ orderId: 'order-1', reason: 'Changed my mind' });
  });

  it('rejects duplicate requests', async () => {
    orders.findOne.mockResolvedValue({ id: 'order-1', status: OrderStatus.Paid, createdAt: new Date(), items: [] });
    cancellations.findOne.mockResolvedValue({ id: 'request-1' });
    await expect(service.requestCancellation('user-1', 'JF-1', 'Again')).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects orders outside the policy', async () => {
    orders.findOne.mockResolvedValue({ id: 'order-1', status: OrderStatus.Shipped, createdAt: new Date(), items: [] });
    cancellations.findOne.mockResolvedValue(null);
    await expect(service.requestCancellation('user-1', 'JF-1', 'Too late')).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});
