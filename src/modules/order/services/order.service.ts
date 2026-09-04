import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListOrdersDto } from '../dto/list-orders.dto';
import { Order } from '../entities/order.entity';

@Injectable()
export class OrderService {
  constructor(@InjectRepository(Order) private readonly orders: Repository<Order>) {}

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
}
