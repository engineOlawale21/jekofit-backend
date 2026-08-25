import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Auth } from '../entities/auth.entity';
import { OAuthAccount } from '../entities/oauth-account.entity';

@Injectable()
export class OAuthService {
  constructor(
    @InjectRepository(Auth)
    private readonly authRepository: Repository<Auth>,
    @InjectRepository(OAuthAccount)
    private readonly oauthAccountRepository: Repository<OAuthAccount>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async validateOAuthUser(
    provider: string,
    providerUserId: string,
    email: string,
    profileData?: any,
  ): Promise<{ accessToken: string; refreshToken: string; isNewUser: boolean }> {
    const normalizedProvider = provider?.trim().toLowerCase();
    const normalizedProviderUserId = providerUserId?.trim();
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedProvider || !normalizedProviderUserId || !normalizedEmail) {
      throw new UnauthorizedException('OAuth provider did not return a usable account identity');
    }

    let oauthAccount = await this.oauthAccountRepository.findOne({
      where: { provider: normalizedProvider, providerUserId: normalizedProviderUserId },
      relations: { user: true },
    });

    if (oauthAccount) {
      const auth = oauthAccount.user;
      const tokens = await this.generateTokens(auth);
      await this.authRepository.update(auth.id, { refreshToken: tokens.refreshToken });
      return { ...tokens, isNewUser: false };
    }

    const existingAuth = await this.authRepository.findOne({
      where: { email: normalizedEmail },
    });

    let user: Auth;
    if (existingAuth) {
      user = existingAuth;
    } else {
      user = this.authRepository.create({
        email: normalizedEmail,
        password: '',
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        firstName: profileData?.firstName,
        lastName: profileData?.lastName,
      });
      await this.authRepository.save(user);
    }

    oauthAccount = this.oauthAccountRepository.create({
      user,
      provider: normalizedProvider,
      providerUserId: normalizedProviderUserId,
    });
    await this.oauthAccountRepository.save(oauthAccount);

    const tokens = await this.generateTokens(user);
    await this.authRepository.update(user.id, { refreshToken: tokens.refreshToken });
    return { ...tokens, isNewUser: !existingAuth };
  }

  private async generateTokens(auth: Auth): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: auth.id, email: auth.email };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '30d',
    });

    return { accessToken, refreshToken };
  }

  getGoogleConfig() {
    return {
      clientID: this.configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: this.configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: this.configService.get('GOOGLE_CALLBACK_URL'),
    };
  }

  getFacebookConfig() {
    return {
      clientID: this.configService.get('FACEBOOK_APP_ID'),
      clientSecret: this.configService.get('FACEBOOK_APP_SECRET'),
      callbackURL: this.configService.get('FACEBOOK_CALLBACK_URL'),
    };
  }

  getAppleConfig() {
    return {
      clientID: this.configService.get('APPLE_CLIENT_ID'),
      teamID: this.configService.get('APPLE_TEAM_ID'),
      keyID: this.configService.get('APPLE_KEY_ID'),
      privateKeyLocation: this.configService.get('APPLE_PRIVATE_KEY_PATH'),
      callbackURL: this.configService.get('APPLE_CALLBACK_URL'),
    };
  }
}
