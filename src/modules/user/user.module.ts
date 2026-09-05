import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auth } from '../auth/entities/auth.entity';
import { NewsletterPreference } from './entities/newsletter-preference.entity';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { AuthRepository } from './repositories/auth.repository';
import { NewsletterPreferenceRepository } from './repositories/newsletter-preference.repository';
import { ConsentAudit } from './entities/consent-audit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Auth, NewsletterPreference, ConsentAudit])],
  controllers: [UserController],
  providers: [UserService, AuthRepository, NewsletterPreferenceRepository],
  exports: [UserService, AuthRepository, NewsletterPreferenceRepository],
})
export class UserModule {}
