import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Auth } from '../../auth/entities/auth.entity';
import { AddCartItemDto } from '../dto/add-cart-item.dto';
import { UpdateCartItemDto } from '../dto/update-cart-item.dto';
import { CartService } from '../services/cart.service';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  get(@CurrentUser() user: Auth) { return this.cart.get(user.id); }

  @Post('items')
  @Throttle({ default: { limit: 30, ttl: 60 } })
  add(@CurrentUser() user: Auth, @Body() input: AddCartItemDto) { return this.cart.add(user.id, input); }

  @Patch('items/:itemId')
  @Throttle({ default: { limit: 30, ttl: 60 } })
  update(@CurrentUser() user: Auth, @Param('itemId') itemId: string, @Body() input: UpdateCartItemDto) { return this.cart.update(user.id, itemId, input); }

  @Delete('items/:itemId')
  @HttpCode(200)
  @Throttle({ default: { limit: 30, ttl: 60 } })
  remove(@CurrentUser() user: Auth, @Param('itemId') itemId: string) { return this.cart.remove(user.id, itemId); }
}
