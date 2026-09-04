import { Controller, Delete, Get, HttpCode, Param, Put, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Auth } from '../../auth/entities/auth.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { FavouriteService } from '../services/favourite.service';

@Controller('favourites')
@UseGuards(JwtAuthGuard)
export class FavouriteController {
  constructor(private readonly favourites: FavouriteService) {}

  @Get()
  list(@CurrentUser() user: Auth) { return this.favourites.list(user.id); }

  @Put('products/:productId')
  @Throttle({ default: { limit: 30, ttl: 60 } })
  add(@CurrentUser() user: Auth, @Param('productId') productId: string) { return this.favourites.add(user.id, productId); }

  @Delete('products/:productId')
  @HttpCode(200)
  @Throttle({ default: { limit: 30, ttl: 60 } })
  remove(@CurrentUser() user: Auth, @Param('productId') productId: string) { return this.favourites.remove(user.id, productId); }
}
