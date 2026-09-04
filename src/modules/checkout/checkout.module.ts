import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartModule } from '../cart/cart.module';
import { CheckoutController } from './controllers/checkout.controller';
import { PaymentWebhookController } from './controllers/payment-webhook.controller';
import { CheckoutSession } from './entities/checkout-session.entity';
import { Payment } from './entities/payment.entity';
import { CheckoutService } from './services/checkout.service';
import { PaymentService } from './services/payment.service';
import { Order } from '../order/entities/order.entity';
import { OrderItem } from '../order/entities/order-item.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { ProductionJob } from '../order/entities/production-job.entity';
import { ProductionModule } from '../order/production.module';

@Module({
  imports: [TypeOrmModule.forFeature([CheckoutSession, Payment, Order, OrderItem, Cart, CartItem, ProductionJob]), CartModule, ProductionModule],
  controllers: [CheckoutController, PaymentWebhookController],
  providers: [CheckoutService, PaymentService],
})
export class CheckoutModule {}
