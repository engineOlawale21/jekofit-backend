import { BadRequestException } from '@nestjs/common';
import { CheckoutSessionStatus } from '../entities/checkout-session.entity';
import { CheckoutService } from './checkout.service';

describe('CheckoutService shipping options', () => {
  const sessions = { findOne: jest.fn(), save: jest.fn() };
  const service = new CheckoutService(sessions as any, {} as any);

  beforeEach(() => jest.clearAllMocks());

  it('returns delivery and pickup prices owned by the checkout session', async () => {
    sessions.findOne.mockResolvedValue({ id: 'session-1', userId: 'user-1', status: CheckoutSessionStatus.Open, subtotal: '50000', currency: 'NGN', expiresAt: new Date(Date.now() + 60_000) });
    const result = await service.shippingOptions('user-1', 'session-1');
    expect(result.options).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'home_delivery', amount: 2500 }),
      expect.objectContaining({ id: 'store_pickup', amount: 0 }),
    ]));
  });

  it('waives delivery for qualifying orders', async () => {
    sessions.findOne.mockResolvedValue({ id: 'session-1', userId: 'user-1', status: CheckoutSessionStatus.Open, subtotal: '100000', currency: 'NGN', expiresAt: new Date(Date.now() + 60_000) });
    const result = await service.shippingOptions('user-1', 'session-1');
    expect(result.options.find((option) => option.id === 'home_delivery')?.amount).toBe(0);
  });

  it('rejects options for a non-open checkout', async () => {
    sessions.findOne.mockResolvedValue({ id: 'session-1', userId: 'user-1', status: CheckoutSessionStatus.Completed, subtotal: '50000', currency: 'NGN' });
    await expect(service.shippingOptions('user-1', 'session-1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
