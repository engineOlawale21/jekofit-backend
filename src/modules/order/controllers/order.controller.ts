import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Auth } from '../../auth/entities/auth.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ListOrdersDto } from '../dto/list-orders.dto';
import { OrderService } from '../services/order.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orders: OrderService) {}

  @Get()
  list(@CurrentUser() user: Auth, @Query() query: ListOrdersDto) { return this.orders.listForUser(user.id, query); }

  @Get(':orderNumber')
  byNumber(@CurrentUser() user: Auth, @Param('orderNumber') orderNumber: string) { return this.orders.getForUser(user.id, orderNumber); }

  @Get(':orderNumber/confirmation')
  confirmation(@CurrentUser() user: Auth, @Param('orderNumber') orderNumber: string) { return this.orders.getForUser(user.id, orderNumber); }

  @Get(':orderNumber/tracking')
  tracking(@CurrentUser() user: Auth, @Param('orderNumber') orderNumber: string) { return this.orders.trackingForUser(user.id, orderNumber); }
}
