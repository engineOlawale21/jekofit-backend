import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Buffer } from 'buffer';
import { Repository } from 'typeorm';
import { ListOrdersDto } from '../dto/list-orders.dto';
import { Order } from '../entities/order.entity';

@Injectable()
export class OrderService {
  constructor(@InjectRepository(Order) private readonly orders: Repository<Order>) {}

  async listForUser(userId: string, query: ListOrdersDto) {
    const builder = this.orders.createQueryBuilder('orders')
      .leftJoinAndSelect('orders.items', 'items')
      .where('orders.userId = :userId', { userId })
      .orderBy('orders.createdAt', 'DESC')
      .addOrderBy('orders.id', 'DESC');
    if (query.status) builder.andWhere('orders.status = :status', { status: query.status });
    if (query.cursor) {
      const cursor = this.decodeCursor(query.cursor);
      builder.andWhere('(orders.createdAt < :createdAt OR (orders.createdAt = :createdAt AND orders.id < :id))', cursor);
    }
    const rows = await builder.take(query.limit + 1).getMany();
    const hasMore = rows.length > query.limit;
    const page = hasMore ? rows.slice(0, query.limit) : rows;
    const total = await this.orders.count({ where: { userId, ...(query.status ? { status: query.status } : {}) } });
    const last = page.length > 0 ? page[page.length - 1] : undefined;
    return { items: page, total, limit: query.limit, nextCursor: hasMore && last ? this.encodeCursor(last) : null };
  }

  private encodeCursor(order: Order) {
    return Buffer.from(JSON.stringify({ createdAt: order.createdAt.toISOString(), id: order.id })).toString('base64url');
  }

  private decodeCursor(value: string): { createdAt: string; id: string } {
    try {
      const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as { createdAt?: string; id?: string };
      if (!parsed.createdAt || !parsed.id || Number.isNaN(Date.parse(parsed.createdAt))) throw new Error();
      return { createdAt: parsed.createdAt, id: parsed.id };
    } catch {
      throw new BadRequestException('Invalid order cursor');
    }
  }

  async getForUser(userId: string, orderNumber: string) {
    const order = await this.orders.findOne({ where: { userId, orderNumber }, relations: { items: true } });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
}
