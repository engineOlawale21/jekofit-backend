import { ConsentType } from '../entities/consent-audit.entity';
import { UserService } from './user.service';

describe('UserService consent audit', () => {
  const auth: any = { findOne: jest.fn() };
  const newsletters: any = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
  const audits: any = { create: jest.fn((value) => value), save: jest.fn(), find: jest.fn() };
  const service = new UserService(auth, newsletters, audits);

  beforeEach(() => jest.clearAllMocks());

  it('records only changed preferences', async () => {
    auth.findOne.mockResolvedValue({ id: 'user-1' });
    newsletters.findOne.mockResolvedValue({ userId: 'user-1', isSubscribed: false, marketingConsent: false });
    newsletters.save.mockImplementation((value) => value);
    await service.updateNewsletter('user-1', { isSubscribed: true, marketingConsent: false });
    expect(audits.create).toHaveBeenCalledWith([
      expect.objectContaining({ userId: 'user-1', type: ConsentType.Newsletter, granted: true }),
    ]);
    expect(audits.save).toHaveBeenCalledTimes(1);
  });

  it('returns only the owned audit history newest first', async () => {
    auth.findOne.mockResolvedValue({ id: 'user-1' });
    audits.find.mockResolvedValue([]);
    await service.getConsentHistory('user-1');
    expect(audits.find).toHaveBeenCalledWith({ where: { userId: 'user-1' }, order: { createdAt: 'DESC' }, take: 100 });
  });
});
