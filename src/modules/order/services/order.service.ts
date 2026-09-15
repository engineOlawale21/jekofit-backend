import { ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListOrdersDto } from '../dto/list-orders.dto';
import { Order } from '../entities/order.entity';
import { CartService } from '../../cart/services/cart.service';

@Injectable()
export class OrderService {
  constructor(@InjectRepository(Order) private readonly orders: Repository<Order>, private readonly cart: CartService) {}

  async listForUser(userId: string, query: ListOrdersDto) {
    const [items, total] = await this.orders.findAndCount({
      where: { userId },
      relations: { items: true },
      order: { createdAt: 'DESC' },
      take: query.limit,
    });
    return { items, total, limit: query.limit };
  }

  async getForUser(userId: string, orderNumber: string) {
    const order = await this.orders.findOne({ where: { userId, orderNumber }, relations: { items: true } });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async reorder(userId: string, orderNumber: string) {
    const order = await this.getForUser(userId, orderNumber);
    const items = order.items
      .filter((item) => item.productVariantId && !item.designSnapshot)
      .map((item) => ({ productVariantId: item.productVariantId!, quantity: item.quantity }));
    const cart = items.length ? await this.cart.addMany(userId, items) : await this.cart.get(userId);
    return { sourceOrderNumber: order.orderNumber, cart, skippedCustomItems: order.items.length - items.length };
  }
}
