import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { PaymentStatus } from '../entities/payment.entity';
import { PaymentEventType } from '../entities/payment-event.entity';
import { PaymentService } from './payment.service';

describe('PaymentService verification fallback', () => {
  const config: any = { get: jest.fn(() => 'secret') };
  const sessions: any = { findOne: jest.fn() };
  const payments: any = { findOne: jest.fn() };
  const events: any = { create: jest.fn((value) => value), save: jest.fn() };
  const service = new PaymentService(config, {} as any, sessions, payments, {} as any, events);

  beforeEach(() => jest.clearAllMocks());

  it('rejects verification for a session not owned by the user', async () => {
    sessions.findOne.mockResolvedValue(null);
    await expect(service.verify('user-1', 'session-1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('records provider failures without storing raw customer payloads', async () => {
    sessions.findOne.mockResolvedValue({ id: 'session-1' });
    payments.findOne.mockResolvedValue({ id: 'payment-1', providerReference: 'ref-1', status: PaymentStatus.Initialized });
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({ status: false, message: 'Unavailable' }) }) as any;
    await expect(service.verify('user-1', 'session-1')).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(events.create).toHaveBeenCalledWith({ paymentId: 'payment-1', type: PaymentEventType.VerificationFailed, details: { providerStatus: 503, message: 'Unavailable' } });
  });

  it('uses the existing idempotent finalization path after successful verification', async () => {
    sessions.findOne.mockResolvedValue({ id: 'session-1' });
    payments.findOne.mockResolvedValue({ id: 'payment-1', providerReference: 'ref-1', status: PaymentStatus.Initialized });
    const charge = { status: 'success', amount: 5000, currency: 'NGN', id: 42 };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ status: true, data: charge }) }) as any;
    jest.spyOn(service as any, 'finalizeSuccessfulPayment').mockResolvedValue(undefined);
    jest.spyOn(service, 'getStatus').mockResolvedValue({ status: 'successful' } as any);
    await service.verify('user-1', 'session-1');
    expect(events.create).toHaveBeenCalledWith(expect.objectContaining({ type: PaymentEventType.VerificationSucceeded }));
    expect((service as any).finalizeSuccessfulPayment).toHaveBeenCalledWith('ref-1', charge);
  });
});
