import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSupportTicketDto } from '../dto/create-support-ticket.dto';
import { SupportTicket } from '../entities/support-ticket.entity';

@Injectable()
export class SupportService {
  constructor(@InjectRepository(SupportTicket) private readonly tickets: Repository<SupportTicket>) {}
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
  async create(dto: CreateSupportTicketDto) {
    const ticket = await this.tickets.save(this.tickets.create({ email: dto.email.trim().toLowerCase(), subject: dto.subject?.trim() || 'General enquiry', message: dto.message.trim() }));
    return { id: ticket.id, status: ticket.status, createdAt: ticket.createdAt };
  }
}
