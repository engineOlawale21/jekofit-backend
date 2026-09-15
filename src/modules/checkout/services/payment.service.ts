import { BadRequestException, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CartItem } from '../../cart/entities/cart-item.entity';
import { Cart } from '../../cart/entities/cart.entity';
import { OrderItem } from '../../order/entities/order-item.entity';
import { Order, OrderStatus } from '../../order/entities/order.entity';
import { CheckoutSession, CheckoutSessionStatus } from '../entities/checkout-session.entity';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { ProductionJob, ProductionJobStatus } from '../../order/entities/production-job.entity';
import { PRODUCTION_QUEUE, ProductionJobName } from '../../order/queues/production.queue';
import { PaymentEvent, PaymentEventType } from '../entities/payment-event.entity';

type PaystackResponse = { status: boolean; data?: { authorization_url: string; access_code: string; reference: string }; message?: string };
type PaystackCharge = { status?: string; amount?: number; currency?: string; id?: number | string };
type PaystackVerificationResponse = { status: boolean; message?: string; data?: PaystackCharge & { reference?: string } };

@Injectable()
export class PaymentService {
  constructor(
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
    @InjectRepository(CheckoutSession) private readonly sessions: Repository<CheckoutSession>,
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
    @InjectQueue(PRODUCTION_QUEUE) private readonly productionQueue: Queue,
    @InjectRepository(PaymentEvent) private readonly paymentEvents: Repository<PaymentEvent>,
  ) {}

  async getStatus(userId: string, sessionId: string) {
    const session = await this.sessions.findOne({ where: { id: sessionId, userId } });
    if (!session) throw new BadRequestException('Checkout session is unavailable');
    const payment = await this.payments.findOne({ where: { checkoutSessionId: session.id }, relations: { order: true } });
    const status = session.status === CheckoutSessionStatus.Completed || payment?.status === PaymentStatus.Paid
      ? 'successful'
      : session.status === CheckoutSessionStatus.Expired
        ? 'expired'
        : payment?.status === PaymentStatus.Failed
          ? 'failed'
          : 'pending';
    return {
      checkoutSessionId: session.id,
      status,
      orderNumber: payment?.order?.orderNumber ?? null,
      amount: payment?.amount ?? session.grandTotal,
      currency: payment?.currency ?? session.currency,
      updatedAt: payment?.updatedAt ?? session.updatedAt,
    };
  }

  async initialize(userId: string, sessionId: string) {
    const session = await this.sessions.findOne({ where: { id: sessionId, userId } });
    if (!session || session.status !== CheckoutSessionStatus.Open || session.expiresAt <= new Date()) throw new BadRequestException('Checkout session is unavailable');
    if (!session.contactEmail || !session.shippingAddress || !session.shippingMethod) throw new BadRequestException('Complete delivery details before payment');
    const secret = this.config.get<string>('PAYSTACK_SECRET_KEY');
    if (!secret) throw new ServiceUnavailableException('Payments are not configured');

    const reference = `JKO-${session.id.replace(/-/g, '').slice(0, 18)}-${randomBytes(4).toString('hex')}`;
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: session.contactEmail,
        amount: String(Math.round(Number(session.grandTotal) * 100)),
        currency: session.currency,
        reference,
        callback_url: `${this.config.get('FRONTEND_URL') ?? 'http://localhost:3000'}/checkout/${session.id}/payment-return`,
        metadata: JSON.stringify({ checkoutSessionId: session.id }),
      }),
    });
    const payload = await response.json() as PaystackResponse;
    if (!response.ok || !payload.status || !payload.data) throw new ServiceUnavailableException(payload.message ?? 'Payment provider unavailable');

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Payment).save(manager.getRepository(Payment).create({
        checkoutSessionId: session.id, provider: 'paystack', providerReference: payload.data!.reference,
        amount: session.grandTotal, currency: session.currency, status: PaymentStatus.Initialized,
      }));
      const payment = await manager.getRepository(Payment).findOneByOrFail({ checkoutSessionId: session.id });
      await manager.getRepository(PaymentEvent).save(manager.getRepository(PaymentEvent).create({
        paymentId: payment.id, type: PaymentEventType.Initialized, details: { reference: payment.providerReference },
      }));
      await manager.getRepository(CheckoutSession).update(session.id, { status: CheckoutSessionStatus.PaymentPending });
    });
    return { authorizationUrl: payload.data.authorization_url, accessCode: payload.data.access_code, reference: payload.data.reference };
  }

  async processWebhook(signature: string | undefined, rawBody: Buffer | undefined, body: unknown) {
    const secret = this.config.get<string>('PAYSTACK_SECRET_KEY');
    if (!secret || !signature) throw new UnauthorizedException();
    if (!rawBody) throw new UnauthorizedException('Webhook body is unavailable');
    const expected = createHmac('sha512', secret).update(rawBody).digest('hex');
    const valid = signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    if (!valid) throw new UnauthorizedException('Invalid payment signature');

    const event = body as { event?: string; data?: PaystackCharge & { reference?: string } };
    if (event.event !== 'charge.success' || !event.data?.reference) return { received: true };
    await this.recordProviderEvent(event.data.reference, PaymentEventType.WebhookReceived, event.data);
    await this.finalizeSuccessfulPayment(event.data.reference, event.data);
    return { received: true };
  }

  async verify(userId: string, sessionId: string) {
    const session = await this.sessions.findOne({ where: { id: sessionId, userId } });
    if (!session) throw new BadRequestException('Checkout session is unavailable');
    const payment = await this.payments.findOne({ where: { checkoutSessionId: session.id } });
    if (!payment) throw new BadRequestException('Payment has not been initialized');
    if (payment.status === PaymentStatus.Paid) return this.getStatus(userId, sessionId);
    const secret = this.config.get<string>('PAYSTACK_SECRET_KEY');
    if (!secret) throw new ServiceUnavailableException('Payments are not configured');
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(payment.providerReference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const payload = await response.json() as PaystackVerificationResponse;
    if (!response.ok || !payload.status || !payload.data) {
      await this.paymentEvents.save(this.paymentEvents.create({ paymentId: payment.id, type: PaymentEventType.VerificationFailed, details: { providerStatus: response.status, message: payload.message ?? null } }));
      throw new ServiceUnavailableException(payload.message ?? 'Unable to verify payment');
    }
    await this.paymentEvents.save(this.paymentEvents.create({ paymentId: payment.id, type: PaymentEventType.VerificationSucceeded, details: this.safeDetails(payload.data) }));
    await this.finalizeSuccessfulPayment(payment.providerReference, payload.data);
    return this.getStatus(userId, sessionId);
  }

  private async recordProviderEvent(reference: string, type: PaymentEventType, data: PaystackCharge) {
    const payment = await this.payments.findOne({ where: { provider: 'paystack', providerReference: reference } });
    if (payment) await this.paymentEvents.save(this.paymentEvents.create({ paymentId: payment.id, type, details: this.safeDetails(data) }));
  }

  private safeDetails(data: PaystackCharge) {
    return { status: data.status ?? null, amount: data.amount ?? null, currency: data.currency ?? null, transactionId: data.id == null ? null : String(data.id) };
  }

  private async finalizeSuccessfulPayment(reference: string, data: PaystackCharge) {
    const productionJobIds = await this.dataSource.transaction(async (manager) => {
      const payment = await manager.getRepository(Payment).findOne({ where: { provider: 'paystack', providerReference: reference }, relations: { checkoutSession: true }, lock: { mode: 'pessimistic_write' } });
      if (!payment || payment.status === PaymentStatus.Paid) return [];
      const session = payment.checkoutSession;
      const expectedAmount = Math.round(Number(payment.amount) * 100);
      if (data.status !== 'success' || data.amount !== expectedAmount || data.currency !== payment.currency) throw new BadRequestException('Payment details do not match checkout session');
      if (!session.shippingAddress) throw new BadRequestException('Checkout address is missing');

      const snapshot = session.cartSnapshot as { items: Array<{ product: { name: string; imageUrl: string | null }; variant: { id: string; colour: string; size: string; unitPrice: number }; designSnapshot?: Record<string, unknown> | null; quantity: number; lineTotal: number }> };
      const orders = manager.getRepository(Order);
      const order = await orders.save(orders.create({
        userId: session.userId,
        orderNumber: `JKO-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`,
        status: OrderStatus.Paid,
        subtotal: session.subtotal, taxTotal: session.taxTotal, shippingTotal: session.shippingTotal,
        grandTotal: session.grandTotal, currency: session.currency, shippingAddress: session.shippingAddress,
      }));
      const orderItems = await manager.getRepository(OrderItem).save(snapshot.items.map((item) => manager.getRepository(OrderItem).create({
        orderId: order.id, productVariantId: item.variant.id, productName: item.product.name,
        variantLabel: `${item.variant.colour} · ${item.variant.size}`, imageUrl: item.product.imageUrl,
        unitPrice: String(item.variant.unitPrice), quantity: item.quantity, lineTotal: String(item.lineTotal), designSnapshot: item.designSnapshot ?? null,
      })));
      const productionJobs = await manager.getRepository(ProductionJob).save(orderItems.map((item) => manager.getRepository(ProductionJob).create({
        orderItemId: item.id,
        status: ProductionJobStatus.Queued,
        productionSnapshot: { productName: item.productName, variantLabel: item.variantLabel, quantity: item.quantity, design: item.designSnapshot ?? null },
      })));
      payment.status = PaymentStatus.Paid;
      payment.providerTransactionId = String(data.id ?? '');
      payment.orderId = order.id;
      await manager.getRepository(Payment).save(payment);
      await manager.getRepository(PaymentEvent).save(manager.getRepository(PaymentEvent).create({ paymentId: payment.id, type: PaymentEventType.Finalized, details: this.safeDetails(data) }));
      await manager.getRepository(CheckoutSession).update(session.id, { status: CheckoutSessionStatus.Completed });
      const cart = await manager.getRepository(Cart).findOne({ where: { userId: session.userId } });
      if (cart) await manager.getRepository(CartItem).delete({ cartId: cart.id });
      return productionJobs.map((job) => job.id);
    });
    await Promise.all(productionJobIds.map((productionJobId) => this.productionQueue.add(ProductionJobName.START, { productionJobId })));
  }
}
