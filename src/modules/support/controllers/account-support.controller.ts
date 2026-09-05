import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Auth } from '../../auth/entities/auth.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateSupportReplyDto } from '../dto/create-support-reply.dto';
import { CreateSupportTicketDto } from '../dto/create-support-ticket.dto';
import { SupportService } from '../services/support.service';

@Controller('support/account/tickets')
@UseGuards(JwtAuthGuard)
export class AccountSupportController {
  constructor(private readonly support: SupportService) {}

  @Get() list(@CurrentUser() user: Auth) { return this.support.listForUser(user.id); }
  @Post() create(@CurrentUser() user: Auth, @Body() dto: CreateSupportTicketDto) { return this.support.create(dto, user.id); }
  @Get(':ticketNumber') get(@CurrentUser() user: Auth, @Param('ticketNumber') ticketNumber: string) { return this.support.getForUser(user.id, ticketNumber); }
  @Post(':ticketNumber/replies') reply(@CurrentUser() user: Auth, @Param('ticketNumber') ticketNumber: string, @Body() dto: CreateSupportReplyDto) {
    return this.support.replyAsCustomer(user.id, ticketNumber, dto.message);
  }
}
