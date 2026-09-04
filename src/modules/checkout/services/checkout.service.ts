import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartService } from '../../cart/services/cart.service';
import { CheckoutSession, CheckoutSessionStatus } from '../entities/checkout-session.entity';
import { UpdateCheckoutDetailsDto } from '../dto/update-checkout-details.dto';

@Injectable()
export class CheckoutService {
  constructor(
    @InjectRepository(CheckoutSession) private readonly sessions: Repository<CheckoutSession>,
    private readonly cart: CartService,
  ) {}

  async create(userId: string) {
    const cart = await this.cart.get(userId);
    if (!cart.items.length) throw new BadRequestException('Your cart is empty');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);
    return this.sessions.save(this.sessions.create({
      userId,
      status: CheckoutSessionStatus.Open,
      cartSnapshot: { items: cart.items, itemCount: cart.itemCount },
      subtotal: String(cart.subtotal),
      taxTotal: '0',
      shippingTotal: '0',
      grandTotal: String(cart.subtotal),
      currency: cart.items[0].variant.currency,
      expiresAt,
    }));
  }

  async get(userId: string, id: string) {
    const session = await this.sessions.findOne({ where: { id, userId } });
    if (!session) throw new NotFoundException('Checkout session not found');
    if (session.status === CheckoutSessionStatus.Open && session.expiresAt <= new Date()) {
      session.status = CheckoutSessionStatus.Expired;
      return this.sessions.save(session);
    }
    return session;
  }

  async updateDetails(userId: string, id: string, details: UpdateCheckoutDetailsDto) {
    const session = await this.get(userId, id);
    if (session.status !== CheckoutSessionStatus.Open) throw new BadRequestException('This checkout session cannot be updated');
    if (details.country.toUpperCase() !== 'NG') throw new BadRequestException('Delivery is currently available in Nigeria only');

    const subtotal = Number(session.subtotal);
    const shippingTotal = details.shippingMethod === 'home_delivery' ? this.homeDeliveryAmount(subtotal) : 0;
    const taxTotal = Math.round(subtotal * 0.075 * 100) / 100;
    session.contactEmail = details.contactEmail.toLowerCase();
    session.shippingAddress = {
      firstName: details.firstName.trim(), lastName: details.lastName.trim(), addressLine1: details.addressLine1.trim(),
      ...(details.addressLine2 ? { addressLine2: details.addressLine2.trim() } : {}), city: details.city.trim(),
      state: details.state.trim(), country: 'NG', phoneNumber: details.phoneNumber.trim(),
    };
    session.shippingMethod = details.shippingMethod;
    session.shippingTotal = String(shippingTotal);
    session.taxTotal = String(taxTotal);
    session.grandTotal = String(Math.round((subtotal + shippingTotal + taxTotal) * 100) / 100);
    return this.sessions.save(session);
  }

  async shippingOptions(userId: string, id: string) {
    const session = await this.get(userId, id);
    if (session.status !== CheckoutSessionStatus.Open) throw new BadRequestException('Shipping options are unavailable for this checkout session');
    const subtotal = Number(session.subtotal);
    const now = new Date();
    const date = (days: number) => {
      const value = new Date(now);
      value.setUTCDate(value.getUTCDate() + days);
      return value.toISOString();
    };
    return {
      checkoutSessionId: session.id,
      currency: session.currency,
      options: [
        {
          id: 'home_delivery',
          name: 'Home delivery',
          description: 'Tracked delivery to your shipping address',
          amount: this.homeDeliveryAmount(subtotal),
          estimatedArrival: { earliest: date(3), latest: date(5) },
        },
        {
          id: 'store_pickup',
          name: 'In-store pickup',
          description: 'Collect from an available Jekofit pickup location',
          amount: 0,
          estimatedArrival: { earliest: date(1), latest: date(2) },
        },
      ],
    };
  }

  private homeDeliveryAmount(subtotal: number) { return subtotal >= 100_000 ? 0 : 2_500; }
}
