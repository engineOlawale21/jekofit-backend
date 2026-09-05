import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auth } from '../auth/entities/auth.entity';
import { NewsletterPreference } from './entities/newsletter-preference.entity';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { AuthRepository } from './repositories/auth.repository';
import { NewsletterPreferenceRepository } from './repositories/newsletter-preference.repository';
import { DeliveryAddress } from './entities/delivery-address.entity';
import { DeliveryAddressService } from './services/delivery-address.service';

@Module({
  imports: [TypeOrmModule.forFeature([Auth, NewsletterPreference, DeliveryAddress])],
  controllers: [UserController],
  providers: [UserService, DeliveryAddressService, AuthRepository, NewsletterPreferenceRepository],
  exports: [UserService, AuthRepository, NewsletterPreferenceRepository],
})
export class UserModule {}
