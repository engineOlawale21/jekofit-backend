import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDeliveryAddressDto, UpdateDeliveryAddressDto } from '../dto/delivery-address.dto';
import { DeliveryAddress } from '../entities/delivery-address.entity';

@Injectable()
export class DeliveryAddressService {
  constructor(@InjectRepository(DeliveryAddress) private readonly addresses: Repository<DeliveryAddress>) {}

  list(userId: string) {
    return this.addresses.find({ where: { userId }, order: { isDefault: 'DESC', createdAt: 'DESC' } });
  }

  async create(userId: string, dto: CreateDeliveryAddressDto) {
    return this.addresses.manager.transaction(async (manager) => {
      const repository = manager.getRepository(DeliveryAddress);
      const existingCount = await repository.count({ where: { userId } });
      const makeDefault = dto.isDefault === true || existingCount === 0;
      if (makeDefault) await repository.update({ userId }, { isDefault: false });
      return repository.save(repository.create({ ...dto, userId, isDefault: makeDefault }));
    });
  }

  async update(userId: string, id: string, dto: UpdateDeliveryAddressDto) {
    return this.addresses.manager.transaction(async (manager) => {
      const repository = manager.getRepository(DeliveryAddress);
      const address = await repository.findOne({ where: { id, userId } });
      if (!address) throw new NotFoundException('Delivery address not found');
      if (dto.isDefault === true) await repository.update({ userId }, { isDefault: false });
      Object.assign(address, dto);
      return repository.save(address);
    });
  }

  async remove(userId: string, id: string) {
    return this.addresses.manager.transaction(async (manager) => {
      const repository = manager.getRepository(DeliveryAddress);
      const address = await repository.findOne({ where: { id, userId } });
      if (!address) throw new NotFoundException('Delivery address not found');
      await repository.remove(address);
      if (address.isDefault) {
        const replacement = await repository.findOne({ where: { userId }, order: { createdAt: 'DESC' } });
        if (replacement) await repository.update({ id: replacement.id, userId }, { isDefault: true });
      }
      return { deleted: true };
    });
  }

  async setDefault(userId: string, id: string) {
    return this.addresses.manager.transaction(async (manager) => {
      const repository = manager.getRepository(DeliveryAddress);
      const address = await repository.findOne({ where: { id, userId } });
      if (!address) throw new NotFoundException('Delivery address not found');
      await repository.update({ userId }, { isDefault: false });
      address.isDefault = true;
      return repository.save(address);
    });
  }
}
