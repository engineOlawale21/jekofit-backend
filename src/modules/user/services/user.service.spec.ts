import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserService } from './user.service';
import { Auth } from '../../auth/entities/auth.entity';
import { NewsletterPreference } from '../entities/newsletter-preference.entity';
import { PersonalInfoDto, UpdatePersonalInfoDto } from '../dto/personal-info.dto';
import { LoginDetailsDto } from '../dto/login-details.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { NewsletterStatusDto } from '../dto/newsletter-status.dto';
import { UpdateNewsletterDto } from '../dto/update-newsletter.dto';

import { AuthRepository } from '../repositories/auth.repository';
import { NewsletterPreferenceRepository } from '../repositories/newsletter-preference.repository';

// Mock bcrypt
jest.mock('bcryptjs');
(bcrypt.compare as jest.Mock).mockResolvedValue(true);
(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

describe('UserService', () => {
  let service: UserService;
  let authRepository: any;
  let newsletterRepository: any;

  const mockAuthRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockNewsletterRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: AuthRepository,
          useValue: mockAuthRepository,
        },
        {
          provide: NewsletterPreferenceRepository,
          useValue: mockNewsletterRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    authRepository = module.get(AuthRepository);
    newsletterRepository = module.get(NewsletterPreferenceRepository);
  });

  describe('getPersonalInfo', () => {
    it('should return personal information for a valid user', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        address: '123 Main St',
        country: 'USA',
        state: 'California',
        city: 'Los Angeles',
        zipCode: '90001',
        isEmailVerified: true,
        provider: 'local',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getPersonalInfo('123');

      expect(result).toEqual({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        address: '123 Main St',
        country: 'USA',
        state: 'California',
        city: 'Los Angeles',
        zipCode: '90001',
        isEmailVerified: true,
        provider: 'local',
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockAuthRepository.findOne.mockResolvedValue(null);

      await expect(service.getPersonalInfo('123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePersonalInfo', () => {
    it('should update personal information for a valid user', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        address: '123 Main St',
        country: 'USA',
        state: 'California',
        city: 'Los Angeles',
        zipCode: '90001',
        isEmailVerified: true,
        provider: 'local',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateDto: UpdatePersonalInfoDto = {
        firstName: 'Jane',
        lastName: 'Smith',
      };

      mockAuthRepository.findOne.mockResolvedValue(mockUser);
      mockAuthRepository.save.mockResolvedValue({ ...mockUser, ...updateDto });

      const result = await service.updatePersonalInfo('123', updateDto);

      expect(result.updated.firstName).toBe('Jane');
      expect(result.updated.lastName).toBe('Smith');
      expect(result.updated.email).toBe('test@example.com');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockAuthRepository.findOne.mockResolvedValue(null);

      await expect(service.updatePersonalInfo('123', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('getLoginDetails', () => {
    it('should return login details for a valid user', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        password: 'hashedPassword',
        isEmailVerified: true,
        provider: 'local',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getLoginDetails('123');

      expect(result.email).toBe('test@example.com');
      expect(result.password).toBe('********');
      expect(result.isEmailVerified).toBe(true);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockAuthRepository.findOne.mockResolvedValue(null);

      await expect(service.getLoginDetails('123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('changePassword', () => {
    it('should change password for a valid user with correct current password', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        password: 'hashedOldPassword',
      };

      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      };

      mockAuthRepository.findOne.mockResolvedValue(mockUser);
      mockAuthRepository.update.mockResolvedValue(undefined);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.changePassword('123', changePasswordDto)).resolves.not.toThrow();
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockAuthRepository.findOne.mockResolvedValue(null);

      await expect(service.changePassword('123', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getNewsletterStatus', () => {
    it('should return newsletter status for a user with existing preference', async () => {
      const mockPreference = {
        userId: '123',
        isSubscribed: true,
        marketingConsent: true,
        subscribedAt: new Date(),
        consentGivenAt: new Date(),
      };

      mockAuthRepository.findOne.mockResolvedValue({ id: '123' });
      mockNewsletterRepository.findOne.mockResolvedValue(mockPreference);

      const result = await service.getNewsletterStatus('123');

      expect(result.isSubscribed).toBe(true);
      expect(result.marketingConsent).toBe(true);
    });

    it('should create default preference if none exists', async () => {
      const defaultPreference = {
        userId: '123',
        isSubscribed: false,
        marketingConsent: false,
      };

      mockAuthRepository.findOne.mockResolvedValue({ id: '123' });
      mockNewsletterRepository.findOne.mockResolvedValue(null);
      mockNewsletterRepository.create.mockReturnValue(defaultPreference);
      mockNewsletterRepository.save.mockResolvedValue(defaultPreference);

      const result = await service.getNewsletterStatus('123');

      expect(result.isSubscribed).toBe(false);
      expect(result.marketingConsent).toBe(false);
    });
  });

  describe('updateNewsletter', () => {
    it('should subscribe user to newsletter', async () => {
      const mockPreference = {
        userId: '123',
        isSubscribed: false,
        marketingConsent: false,
      };

      const updateDto: UpdateNewsletterDto = {
        isSubscribed: true,
      };

      mockAuthRepository.findOne.mockResolvedValue({ id: '123' });
      mockNewsletterRepository.findOne.mockResolvedValue(mockPreference);
      mockNewsletterRepository.save.mockResolvedValue({ ...mockPreference, isSubscribed: true, subscribedAt: new Date() });

      const result = await service.updateNewsletter('123', updateDto);

      expect(result.isSubscribed).toBe(true);
    });

    it('should unsubscribe user from newsletter', async () => {
      const mockPreference = {
        userId: '123',
        isSubscribed: true,
        marketingConsent: false,
      };

      const updateDto: UpdateNewsletterDto = {
        isSubscribed: false,
      };

      mockAuthRepository.findOne.mockResolvedValue({ id: '123' });
      mockNewsletterRepository.findOne.mockResolvedValue(mockPreference);
      mockNewsletterRepository.save.mockResolvedValue({ ...mockPreference, isSubscribed: false, unsubscribedAt: new Date() });

      const result = await service.updateNewsletter('123', updateDto);

      expect(result.isSubscribed).toBe(false);
    });

    it('should grant marketing consent', async () => {
      const mockPreference = {
        userId: '123',
        isSubscribed: false,
        marketingConsent: false,
      };

      const updateDto: UpdateNewsletterDto = {
        marketingConsent: true,
      };

      mockAuthRepository.findOne.mockResolvedValue({ id: '123' });
      mockNewsletterRepository.findOne.mockResolvedValue(mockPreference);
      mockNewsletterRepository.save.mockResolvedValue({ ...mockPreference, marketingConsent: true, consentGivenAt: new Date() });

      const result = await service.updateNewsletter('123', updateDto);

      expect(result.marketingConsent).toBe(true);
    });

    it('should withdraw marketing consent', async () => {
      const mockPreference = {
        userId: '123',
        isSubscribed: false,
        marketingConsent: true,
      };

      const updateDto: UpdateNewsletterDto = {
        marketingConsent: false,
      };

      mockAuthRepository.findOne.mockResolvedValue({ id: '123' });
      mockNewsletterRepository.findOne.mockResolvedValue(mockPreference);
      mockNewsletterRepository.save.mockResolvedValue({ ...mockPreference, marketingConsent: false, consentWithdrawnAt: new Date() });

      const result = await service.updateNewsletter('123', updateDto);

      expect(result.marketingConsent).toBe(false);
    });
  });
});
