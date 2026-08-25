import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-apple';
import { ConfigService } from '@nestjs/config';
import { OAuthService } from '../services/oauth.service';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple', 6) {
  constructor(
    private readonly configService: ConfigService,
    private readonly oauthService: OAuthService,
  ) {
    super({
      clientID: configService.get('APPLE_CLIENT_ID'),
      teamID: configService.get('APPLE_TEAM_ID'),
      keyID: configService.get('APPLE_KEY_ID'),
      privateKeyLocation: configService.get('APPLE_PRIVATE_KEY_PATH'),
      callbackURL: configService.get('APPLE_CALLBACK_URL'),
      scope: ['email', 'name'],
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request & { appleProfile?: { email?: string; name?: { firstName?: string; lastName?: string } } },
    _accessToken: string,
    _refreshToken: string,
    idToken: string,
    _profile: unknown,
  ) {
    const claims = this.decodeIdToken(idToken);
    const providerUserId = claims.sub;
    const email = req.appleProfile?.email || claims.email;

    if (!providerUserId || !email) {
      throw new UnauthorizedException('Apple did not return a usable account identity');
    }
    
    return this.oauthService.validateOAuthUser(
      'apple',
      providerUserId,
      email,
      {
        firstName: req.appleProfile?.name?.firstName,
        lastName: req.appleProfile?.name?.lastName,
      },
    );
  }

  private decodeIdToken(idToken: string): { sub?: string; email?: string } {
    try {
      const payload = idToken.split('.')[1];
      if (!payload) {
        throw new Error('missing payload');
      }

      return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    } catch {
      throw new UnauthorizedException('Apple returned an invalid identity token');
    }
  }
}
