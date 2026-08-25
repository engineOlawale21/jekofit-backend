import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuthService } from './oauth.service';
import { Auth } from '../entities/auth.entity';
import { OAuthAccount } from '../entities/oauth-account.entity';

describe('OAuthService', () => {
  let service: OAuthService;
  let authRepository: Repository<Auth>;
  let oauthAccountRepository: Repository<OAuthAccount>;
  let configService: ConfigService;
  let jwtService: JwtService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuthService,
        {
          provide: getRepositoryToken(Auth),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(OAuthAccount),
          useClass: Repository,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'GOOGLE_CLIENT_ID': 'google-id',
                'GOOGLE_CLIENT_SECRET': 'google-secret',
                'GOOGLE_CALLBACK_URL': 'http://localhost:3000/auth/google/callback',
                'FACEBOOK_APP_ID': 'facebook-id',
                'FACEBOOK_APP_SECRET': 'facebook-secret',
                'FACEBOOK_CALLBACK_URL': 'http://localhost:3000/auth/facebook/callback',
                'APPLE_CLIENT_ID': 'apple-id',
                'APPLE_TEAM_ID': 'apple-team',
                'APPLE_KEY_ID': 'apple-key',
                'APPLE_PRIVATE_KEY_PATH': './AuthKey.p8',
                'APPLE_CALLBACK_URL': 'http://localhost:3000/auth/apple/callback',
              };
              return config[key];
            }),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn((payload) => 'jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<OAuthService>(OAuthService);
    authRepository = module.get<Repository<Auth>>(getRepositoryToken(Auth));
    oauthAccountRepository = module.get<Repository<OAuthAccount>>(getRepositoryToken(OAuthAccount));
    configService = module.get<ConfigService>(ConfigService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('validateOAuthUser', () => {
    it('rejects a provider response without a usable identity before querying the database', async () => {
      const findOneSpy = jest.spyOn(oauthAccountRepository, 'findOne');

      await expect(service.validateOAuthUser('google', '', 'test@example.com')).rejects.toThrow(
        'OAuth provider did not return a usable account identity',
      );
      expect(findOneSpy).not.toHaveBeenCalled();
    });

    it('normalizes provider identity values before looking up an account', async () => {
      jest.spyOn(oauthAccountRepository, 'findOne').mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
      } as any);
      jest.spyOn(authRepository, 'update').mockResolvedValue({} as any);

      await service.validateOAuthUser(' Google ', ' google-123 ', ' TEST@EXAMPLE.COM ');

      expect(oauthAccountRepository.findOne).toHaveBeenCalledWith({
        where: { provider: 'google', providerUserId: 'google-123' },
        relations: { user: true },
      });
    });

    it('should return existing user tokens if user already exists', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
      };
      const mockOAuthAccount = {
        id: 'oauth-123',
        provider: 'google',
        providerUserId: 'google-123',
        user: mockUser,
      };

      jest.spyOn(oauthAccountRepository, 'findOne').mockResolvedValue(mockOAuthAccount as any);
      jest.spyOn(authRepository, 'update').mockResolvedValue({} as any);
      jest.spyOn(service as any, 'generateTokens').mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      const result = await service.validateOAuthUser('google', 'google-123', 'test@example.com');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.isNewUser).toBe(false);
    });

    it('should link OAuth account to existing user with same email', async () => {
      const mockExistingAuth = {
        id: '123',
        email: 'test@example.com',
      };
      const mockOAuthAccount = {
        id: 'oauth-123',
        provider: 'google',
        providerUserId: 'google-123',
        user: mockExistingAuth,
      };

      jest.spyOn(oauthAccountRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(authRepository, 'findOne').mockResolvedValue(mockExistingAuth as any);
      jest.spyOn(oauthAccountRepository, 'create').mockReturnValue(mockOAuthAccount as any);
      jest.spyOn(oauthAccountRepository, 'save').mockResolvedValue(mockOAuthAccount as any);
      jest.spyOn(authRepository, 'update').mockResolvedValue({} as any);
      jest.spyOn(service as any, 'generateTokens').mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      const result = await service.validateOAuthUser('google', 'google-123', 'test@example.com');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.isNewUser).toBe(false);
    });

    it('should create new user if no existing user found', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
      };
      const mockOAuthAccount = {
        id: 'oauth-123',
        provider: 'google',
        providerUserId: 'google-123',
        user: mockUser,
      };

      jest.spyOn(oauthAccountRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(authRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(authRepository, 'create').mockReturnValue(mockUser as any);
      jest.spyOn(authRepository, 'save').mockResolvedValue(mockUser as any);
      jest.spyOn(oauthAccountRepository, 'create').mockReturnValue(mockOAuthAccount as any);
      jest.spyOn(oauthAccountRepository, 'save').mockResolvedValue(mockOAuthAccount as any);
      jest.spyOn(authRepository, 'update').mockResolvedValue({} as any);
      jest.spyOn(service as any, 'generateTokens').mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      const result = await service.validateOAuthUser('google', 'google-123', 'test@example.com');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.isNewUser).toBe(true);
    });
  });

  describe('getGoogleConfig', () => {
    it('should return Google OAuth configuration', () => {
      const config = service.getGoogleConfig();

      expect(config).toEqual({
        clientID: 'google-id',
        clientSecret: 'google-secret',
        callbackURL: 'http://localhost:3000/auth/google/callback',
      });
    });
  });

  describe('getFacebookConfig', () => {
    it('should return Facebook OAuth configuration', () => {
      const config = service.getFacebookConfig();

      expect(config).toEqual({
        clientID: 'facebook-id',
        clientSecret: 'facebook-secret',
        callbackURL: 'http://localhost:3000/auth/facebook/callback',
      });
    });
  });

  describe('getAppleConfig', () => {
    it('should return Apple OAuth configuration', () => {
      const config = service.getAppleConfig();

      expect(config).toEqual({
        clientID: 'apple-id',
        teamID: 'apple-team',
        keyID: 'apple-key',
        privateKeyLocation: './AuthKey.p8',
        callbackURL: 'http://localhost:3000/auth/apple/callback',
      });
    });
  });
});
