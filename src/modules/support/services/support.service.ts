import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSupportTicketDto } from '../dto/create-support-ticket.dto';
import { SupportTicket } from '../entities/support-ticket.entity';
import { SupportTicketReply, SupportReplyAuthor } from '../entities/support-ticket-reply.entity';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicket) private readonly tickets: Repository<SupportTicket>,
    @InjectRepository(SupportTicketReply) private readonly replies: Repository<SupportTicketReply>,
  ) {}
  private readonly faqs = [
    { id: 'about-jekofit', question: 'What is JEKOFIT known for?', answer: 'Jekofit creates customizable clothing and lifestyle products, including shirts, caps and bags.' },
    { id: 'custom-items', question: 'How long does it take to receive my custom item?', answer: 'Production and delivery estimates are shown during checkout and depend on the selected delivery method.' },
    { id: 'bulk-order', question: 'Can I order in bulk for my business or event?', answer: 'Yes. Submit a support ticket with the required product, quantity and delivery date for a tailored quote.' },
    { id: 'returns', question: 'What is your return policy?', answer: 'Eligible standard items may be returned under the published return policy. Personalized items can only be returned when faulty.' },
    { id: 'updates', question: 'How can I stay updated on new collections and promotions?', answer: 'Manage newsletter and marketing preferences from the account page.' },
    { id: 'payments', question: 'What payment method do you accept?', answer: 'Checkout payments are processed securely through Paystack using the methods available for the transaction.' },
  ];
  listFaqs(query?: string) {
    const term = query?.trim().toLowerCase();
    return term ? this.faqs.filter((faq) => `${faq.question} ${faq.answer}`.toLowerCase().includes(term)) : this.faqs;
  }
  async create(dto: CreateSupportTicketDto, userId: string | null = null) {
    const suffix = Math.floor(Math.random() * 0x100000000).toString(16).padStart(8, '0').toUpperCase();
    const ticketNumber = `JF-${new Date().getUTCFullYear()}-${suffix}`;
    const ticket = await this.tickets.save(this.tickets.create({ ticketNumber, userId, email: dto.email.trim().toLowerCase(), subject: dto.subject?.trim() || 'General enquiry', message: dto.message.trim() }));
    return { id: ticket.id, ticketNumber: ticket.ticketNumber, status: ticket.status, createdAt: ticket.createdAt };
  }

  listForUser(userId: string) {
    return this.tickets.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async getForUser(userId: string, ticketNumber: string) {
    const ticket = await this.tickets.findOne({ where: { userId, ticketNumber }, relations: { replies: true }, order: { replies: { createdAt: 'ASC' } } });
    if (!ticket) throw new NotFoundException('Support ticket not found');
    return ticket;
  }

  async replyAsCustomer(userId: string, ticketNumber: string, message: string) {
    const ticket = await this.tickets.findOne({ where: { userId, ticketNumber } });
    if (!ticket) throw new NotFoundException('Support ticket not found');
    return this.replies.save(this.replies.create({ ticketId: ticket.id, author: SupportReplyAuthor.Customer, message: message.trim() }));
  }
}
