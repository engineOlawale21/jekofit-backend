import { NotFoundException } from '@nestjs/common';
import { DeliveryAddressService } from './delivery-address.service';

describe('DeliveryAddressService', () => {
  const repository: any = {
    find: jest.fn(), findOne: jest.fn(), count: jest.fn(), update: jest.fn(),
    create: jest.fn((value) => value), save: jest.fn((value) => value), remove: jest.fn(),
  };
  const addresses: any = {
    find: jest.fn(),
    manager: { transaction: jest.fn((work) => work({ getRepository: () => repository })) },
  };
  const service = new DeliveryAddressService(addresses);

  beforeEach(() => jest.clearAllMocks());

  it('automatically makes the first saved address the default', async () => {
    repository.count.mockResolvedValue(0);
    const result = await service.create('user-1', {
      firstName: 'Ada', lastName: 'Okafor', phoneNumber: '+2348012345678',
      addressLine1: '1 Marina Road', city: 'Lagos', state: 'Lagos', postalCode: '100001', countryCode: 'NG',
    });
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1', isDefault: true }));
    expect(result.isDefault).toBe(true);
  });

  it('does not allow a user to update another user address', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(service.update('user-1', 'address-1', { city: 'Abuja' })).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 'address-1', userId: 'user-1' } });
  });

  it('promotes a replacement after deleting the default address', async () => {
    repository.findOne
      .mockResolvedValueOnce({ id: 'address-1', userId: 'user-1', isDefault: true })
      .mockResolvedValueOnce({ id: 'address-2', userId: 'user-1', isDefault: false });
    await service.remove('user-1', 'address-1');
    expect(repository.update).toHaveBeenCalledWith({ id: 'address-2', userId: 'user-1' }, { isDefault: true });
  });
});
