import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Auth } from '../../auth/entities/auth.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ListOrdersDto } from '../dto/list-orders.dto';
import { OrderService } from '../services/order.service';
import { RequestCancellationDto } from '../dto/request-cancellation.dto';

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

  @Post(':orderNumber/reorder')
  reorder(@CurrentUser() user: Auth, @Param('orderNumber') orderNumber: string) { return this.orders.reorder(user.id, orderNumber); }
}
