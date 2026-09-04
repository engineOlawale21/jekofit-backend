import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { Auth } from '../entities/auth.entity';
import { PasswordReset } from '../entities/password-reset.entity';
import { EmailVerification } from '../entities/email-verification.entity';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';

jest.mock('bcryptjs');
(bcrypt.compare as jest.Mock).mockResolvedValue(true);
(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

describe('AuthService', () => {
  let service: AuthService;
  let authRepository: Repository<Auth>;
  let passwordResetRepository: Repository<PasswordReset>;
  let emailVerificationRepository: Repository<EmailVerification>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Auth),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(PasswordReset),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(EmailVerification),
          useClass: Repository,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn((payload) => 'jwt-token'),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
            sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: 'BullQueue_email',
          useValue: { add: jest.fn().mockResolvedValue({ id: 'test-job' }) },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    authRepository = module.get<Repository<Auth>>(getRepositoryToken(Auth));
    passwordResetRepository = module.get<Repository<PasswordReset>>(getRepositoryToken(PasswordReset));
    emailVerificationRepository = module.get<Repository<EmailVerification>>(getRepositoryToken(EmailVerification));
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      jest.spyOn(authRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(authRepository, 'create').mockReturnValue({
        email: registerDto.email,
        password: 'hashed_password',
      } as any);
      jest.spyOn(authRepository, 'save').mockResolvedValue({
        id: '123',
        email: registerDto.email,
      } as any);
      jest.spyOn(service as any, 'sendVerificationEmail').mockResolvedValue(undefined);

      await service.register(registerDto);

      expect(authRepository.save).toHaveBeenCalled();
      expect(service['sendVerificationEmail']).toHaveBeenCalledWith('123');
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      const mockUser = {
        id: '123',
        email: loginDto.email,
        password: 'hashed_password',
        isEmailVerified: true,
      };

      jest.spyOn(authRepository, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(authRepository, 'update').mockResolvedValue({} as any);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException with invalid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      };

      const mockUser = {
        id: '123',
        email: loginDto.email,
        password: 'hashed_password',
      };

      jest.spyOn(authRepository, 'findOne').mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'SecurePass123!',
      };

      jest.spyOn(authRepository, 'findOne').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should return user if found', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
      };

      jest.spyOn(authRepository, 'findOne').mockResolvedValue(mockUser as any);

      const result = await service.validateUser('123');

      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      jest.spyOn(authRepository, 'findOne').mockResolvedValue(null);

      await expect(service.validateUser('123')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        refreshToken: 'valid-refresh-token',
      };

      jest.spyOn(authRepository, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(authRepository, 'update').mockResolvedValue({} as any);

      const result = await service.refreshTokens('valid-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException with invalid refresh token', async () => {
      jest.spyOn(authRepository, 'findOne').mockResolvedValue(null);

      await expect(service.refreshTokens('invalid-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should clear refresh token', async () => {
      jest.spyOn(authRepository, 'update').mockResolvedValue({} as any);

      await service.logout('123');

      expect(authRepository.update).toHaveBeenCalledWith('123', { refreshToken: null });
    });
  });

  describe('forgotPassword', () => {
    it('should create password reset token', async () => {
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'test@example.com',
      };

      const mockUser = {
        id: '123',
        email: forgotPasswordDto.email,
      };

      jest.spyOn(authRepository, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(passwordResetRepository, 'delete').mockResolvedValue({} as any);
      jest.spyOn(passwordResetRepository, 'create').mockReturnValue({} as any);
      jest.spyOn(passwordResetRepository, 'save').mockResolvedValue({} as any);

      await service.forgotPassword(forgotPasswordDto);

      expect(passwordResetRepository.delete).toHaveBeenCalledWith({ userId: '123' });
      expect(passwordResetRepository.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if user not found', async () => {
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'nonexistent@example.com',
      };

      jest.spyOn(authRepository, 'findOne').mockResolvedValue(null);

      await expect(service.forgotPassword(forgotPasswordDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        token: 'valid-token',
        newPassword: 'NewSecurePass456!',
      };

      const mockPasswordReset = {
        id: '456',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 3600000),
        isUsed: false,
        user: {
          id: '123',
        },
      };

      jest.spyOn(passwordResetRepository, 'findOne').mockResolvedValue(mockPasswordReset as any);
      jest.spyOn(authRepository, 'update').mockResolvedValue({} as any);
      jest.spyOn(passwordResetRepository, 'update').mockResolvedValue({} as any);

      await service.resetPassword(resetPasswordDto);

      expect(authRepository.update).toHaveBeenCalledWith('123', expect.any(Object));
      expect(passwordResetRepository.update).toHaveBeenCalledWith('456', { isUsed: true });
    });

    it('should throw BadRequestException with invalid token', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        token: 'invalid-token',
        newPassword: 'NewSecurePass456!',
      };

      jest.spyOn(passwordResetRepository, 'findOne').mockResolvedValue(null);

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(BadRequestException);
    });
  });
});
