import { Body, Controller, Headers, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PaymentService } from '../services/payment.service';

type RawBodyRequest = Request & { rawBody?: Buffer };

@Controller('payments/paystack')
@UseGuards(JwtAuthGuard)
export class PaymentWebhookController {
  constructor(private readonly payment: PaymentService) {}

  @Public()
  @Post('webhook')
  @HttpCode(200)
  webhook(@Headers('x-paystack-signature') signature: string | undefined, @Req() request: RawBodyRequest, @Body() body: unknown) {
    return this.payment.processWebhook(signature, request.rawBody, body);
  }
}
