import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '../entities/order.entity';
import { OrderService } from './order.service';

describe('OrderService history pagination', () => {
  const builder: any = {
    leftJoinAndSelect: jest.fn(), where: jest.fn(), orderBy: jest.fn(), addOrderBy: jest.fn(),
    andWhere: jest.fn(), take: jest.fn(), getMany: jest.fn(),
  };
  Object.keys(builder).forEach((key) => { if (key !== 'getMany') builder[key].mockReturnValue(builder); });
  const orders = { createQueryBuilder: jest.fn(() => builder), count: jest.fn() };
  const service = new OrderService(orders as any);

  beforeEach(() => jest.clearAllMocks());

  it('returns a stable next cursor and filters status', async () => {
    const first = { id: 'b', createdAt: new Date('2026-01-02T00:00:00Z') };
    const second = { id: 'a', createdAt: new Date('2026-01-01T00:00:00Z') };
    builder.getMany.mockResolvedValue([first, second]);
    orders.count.mockResolvedValue(5);
    const result = await service.listForUser('user-1', { limit: 1, status: OrderStatus.Paid });
    expect(result.items).toEqual([first]);
    expect(result.nextCursor).toEqual(expect.any(String));
    expect(builder.andWhere).toHaveBeenCalledWith('orders.status = :status', { status: OrderStatus.Paid });
  });

  it('rejects malformed cursors', async () => {
    await expect(service.listForUser('user-1', { limit: 20, cursor: 'bad' })).rejects.toBeInstanceOf(BadRequestException);
  });
});
