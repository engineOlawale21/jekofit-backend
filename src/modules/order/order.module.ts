import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './controllers/order.controller';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';
import { OrderService } from './services/order.service';
import { OrderTrackingEvent } from './entities/order-tracking-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, OrderTrackingEvent])],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
