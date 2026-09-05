import { NotFoundException } from '@nestjs/common';
import { SupportReplyAuthor } from '../entities/support-ticket-reply.entity';
import { SupportService } from './support.service';

describe('SupportService ticket history', () => {
  const tickets: any = { create: jest.fn((value) => value), save: jest.fn((value) => ({ id: 'id-1', createdAt: new Date(), status: 'open', ...value })), find: jest.fn(), findOne: jest.fn() };
  const replies: any = { create: jest.fn((value) => value), save: jest.fn((value) => value) };
  const service = new SupportService(tickets, replies);
  beforeEach(() => jest.clearAllMocks());

  it('associates authenticated tickets and returns a human-readable number', async () => {
    const result = await service.create({ email: 'USER@example.com', message: 'Help me' }, 'user-1');
    expect(tickets.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1', email: 'user@example.com' }));
    expect(result.ticketNumber).toMatch(/^JF-\d{4}-[A-F0-9]{8}$/);
  });

  it('scopes customer replies to an owned ticket', async () => {
    tickets.findOne.mockResolvedValue({ id: 'ticket-1' });
    await service.replyAsCustomer('user-1', 'JF-2026-12345678', ' Any update? ');
    expect(replies.create).toHaveBeenCalledWith({ ticketId: 'ticket-1', author: SupportReplyAuthor.Customer, message: 'Any update?' });
  });

  it('hides tickets that are not owned by the user', async () => {
    tickets.findOne.mockResolvedValue(null);
    await expect(service.getForUser('user-1', 'JF-2026-12345678')).rejects.toBeInstanceOf(NotFoundException);
  });
});
