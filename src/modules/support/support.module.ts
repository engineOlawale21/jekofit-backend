import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportController } from './controllers/support.controller';
import { SupportTicket } from './entities/support-ticket.entity';
import { SupportService } from './services/support.service';
import { SupportTicketReply } from './entities/support-ticket-reply.entity';
import { AccountSupportController } from './controllers/account-support.controller';

@Module({ imports: [TypeOrmModule.forFeature([SupportTicket, SupportTicketReply])], controllers: [SupportController, AccountSupportController], providers: [SupportService] })
export class SupportModule {}
