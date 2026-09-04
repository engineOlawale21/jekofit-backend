import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { AuthService } from './services/auth.service';
import { OAuthService } from './services/oauth.service';
import { ProfileService } from './services/profile.service';
import { EmailService } from './services/email.service';
import { AuthController } from './controllers/auth.controller';
import { OAuthController } from './controllers/oauth.controller';
import { Auth } from './entities/auth.entity';
import { PasswordReset } from './entities/password-reset.entity';
import { EmailVerification } from './entities/email-verification.entity';
import { OAuthAccount } from './entities/oauth-account.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { AppleStrategy } from './strategies/apple.strategy';
import { EmailProcessor } from './processors/email.processor';
import { CleanupProcessor } from './processors/cleanup.processor';
import { EMAIL_QUEUE } from './queues/email.queue';
import { CLEANUP_QUEUE } from './queues/cleanup.queue';

@Module({
  imports: [
    TypeOrmModule.forFeature([Auth, PasswordReset, EmailVerification, OAuthAccount]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN') || '15m',
        },
      }),
      inject: [ConfigService],
    }),

    // ── Email queue ──────────────────────────────────────────────────────
    BullModule.registerQueue({
      name: EMAIL_QUEUE,
      defaultJobOptions: {
        // Keep failed jobs in Redis for 7 days so they can be inspected
        removeOnFail: { age: 7 * 24 * 3600 },
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 3_000 },
      },
    }),

    // ── Cleanup queue ────────────────────────────────────────────────────
    BullModule.registerQueue({
      name: CLEANUP_QUEUE,
      defaultJobOptions: {
        removeOnFail: { age: 7 * 24 * 3600 },
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
      },
    }),
  ],
  controllers: [AuthController, OAuthController],
  providers: [
    AuthService,
    OAuthService,
    ProfileService,
    EmailService,
    JwtStrategy,
    GoogleStrategy,
    FacebookStrategy,
    AppleStrategy,
    EmailProcessor,
    CleanupProcessor,
  ],
  exports: [AuthService, OAuthService, ProfileService, EmailService, JwtModule],
})
export class AuthModule {}
