import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CreateSupportTicketDto } from '../dto/create-support-ticket.dto';
import { SupportService } from '../services/support.service';

@Controller('support')
export class SupportController {
  constructor(private readonly support: SupportService) {}
  @Get('faqs')
  faqs(@Query('query') query?: string) { return this.support.listFaqs(query); }
  @Post('tickets')
  @Throttle({ default: { limit: 5, ttl: 60 } })
  create(@Body() dto: CreateSupportTicketDto) { return this.support.create(dto); }
}
