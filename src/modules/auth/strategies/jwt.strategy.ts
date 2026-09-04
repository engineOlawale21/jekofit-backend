import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { Auth } from '../entities/auth.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Auth)
    private readonly authRepository: Repository<Auth>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Primary: read from HttpOnly cookie
        (request: Request) => request?.cookies?.accessToken ?? null,
        // Fallback: read from Authorization: Bearer <token> (for Swagger UI)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
      passReqToCallback: false,
    });
  }

  async validate(payload: any) {
    const auth = await this.authRepository.findOne({
      where: { id: payload.sub },
    });

    if (!auth) {
      throw new UnauthorizedException();
    }

    return auth;
  }
}
