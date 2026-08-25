import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfileService } from './profile.service';
import { Auth } from '../entities/auth.entity';
import { UpdateProfileDto } from '../dto/update-profile.dto';

describe('ProfileService', () => {
  let service: ProfileService;
  let authRepository: Repository<Auth>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: getRepositoryToken(Auth),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    authRepository = module.get<Repository<Auth>>(getRepositoryToken(Auth));
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const updateProfileDto: UpdateProfileDto = {
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
      };

      const mockAuth = {
        id: '123',
        email: 'test@example.com',
        firstName: 'OldName',
      };

      jest.spyOn(authRepository, 'findOne').mockResolvedValue(mockAuth as any);
      jest.spyOn(authRepository, 'save').mockResolvedValue({
        ...mockAuth,
        ...updateProfileDto,
      } as any);

      const result = await service.updateProfile('123', updateProfileDto);

      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.phoneNumber).toBe('+1234567890');
    });

    it('should throw NotFoundException if user not found', async () => {
      const updateProfileDto: UpdateProfileDto = {
        firstName: 'John',
      };

      jest.spyOn(authRepository, 'findOne').mockResolvedValue(null);

      await expect(service.updateProfile('123', updateProfileDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockAuth = {
        id: '123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      jest.spyOn(authRepository, 'findOne').mockResolvedValue(mockAuth as any);

      const result = await service.getProfile('123');

      expect(result).toEqual(mockAuth);
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(authRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getProfile('123')).rejects.toThrow(NotFoundException);
    });
  });
});
