import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Auth } from '../../auth/entities/auth.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CheckoutService } from '../services/checkout.service';
import { UpdateCheckoutDetailsDto } from '../dto/update-checkout-details.dto';
import { PaymentService } from '../services/payment.service';

@Controller('checkout/sessions')
@UseGuards(JwtAuthGuard)
export class CheckoutController {
  constructor(private readonly checkout: CheckoutService, private readonly payment: PaymentService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60 } })
  create(@CurrentUser() user: Auth) { return this.checkout.create(user.id); }

  @Get(':id')
  get(@CurrentUser() user: Auth, @Param('id') id: string) { return this.checkout.get(user.id, id); }

  @Get(':id/shipping-options')
  shippingOptions(@CurrentUser() user: Auth, @Param('id') id: string) { return this.checkout.shippingOptions(user.id, id); }

  @Patch(':id/details')
  @Throttle({ default: { limit: 10, ttl: 60 } })
  updateDetails(@CurrentUser() user: Auth, @Param('id') id: string, @Body() details: UpdateCheckoutDetailsDto) {
    return this.checkout.updateDetails(user.id, id, details);
  }

  @Post(':id/payment')
  @Throttle({ default: { limit: 5, ttl: 60 } })
  initializePayment(@CurrentUser() user: Auth, @Param('id') id: string) { return this.payment.initialize(user.id, id); }

  @Get(':id/payment-status')
  paymentStatus(@CurrentUser() user: Auth, @Param('id') id: string) { return this.payment.getStatus(user.id, id); }

}
