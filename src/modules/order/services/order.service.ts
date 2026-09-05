import { ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListOrdersDto } from '../dto/list-orders.dto';
import { Order, OrderStatus } from '../entities/order.entity';
import { OrderCancellation } from '../entities/order-cancellation.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(OrderCancellation) private readonly cancellations: Repository<OrderCancellation>,
  ) {}

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

  async cancellationPolicy(userId: string, orderNumber: string) {
    const order = await this.getForUser(userId, orderNumber);
    const deadline = new Date(order.createdAt.getTime() + 30 * 60 * 1000);
    const existingRequest = await this.cancellations.findOne({ where: { orderId: order.id } });
    const eligible = order.status === OrderStatus.Paid && Date.now() <= deadline.getTime() && !existingRequest;
    return { eligible, deadline, existingRequest, reason: eligible ? null : this.ineligibilityReason(order, deadline, existingRequest) };
  }

  async requestCancellation(userId: string, orderNumber: string, reason: string) {
    const order = await this.getForUser(userId, orderNumber);
    const existing = await this.cancellations.findOne({ where: { orderId: order.id } });
    if (existing) throw new ConflictException('A cancellation request already exists');
    const deadline = new Date(order.createdAt.getTime() + 30 * 60 * 1000);
    if (order.status !== OrderStatus.Paid || Date.now() > deadline.getTime()) {
      throw new UnprocessableEntityException(this.ineligibilityReason(order, deadline, null));
    }
    return this.cancellations.save(this.cancellations.create({ orderId: order.id, reason: reason.trim() }));
  }

  private ineligibilityReason(order: Order, deadline: Date, existing: OrderCancellation | null) {
    if (existing) return 'A cancellation request already exists';
    if (order.status !== OrderStatus.Paid) return `Orders with status ${order.status} cannot be cancelled`;
    if (Date.now() > deadline.getTime()) return 'The 30-minute cancellation window has expired';
    return 'This order is not eligible for cancellation';
  }
}
