import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PersonalInfoDto, UpdatePersonalInfoDto } from '../dto/personal-info.dto';
import { LoginDetailsDto } from '../dto/login-details.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { NewsletterStatusDto } from '../dto/newsletter-status.dto';
import { UpdateNewsletterDto } from '../dto/update-newsletter.dto';
import { EmailVerificationDto } from '../dto/email-verification.dto';
import { AuthRepository } from '../repositories/auth.repository';
import { NewsletterPreferenceRepository } from '../repositories/newsletter-preference.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly newsletterRepository: NewsletterPreferenceRepository,
  ) {}

  async getPersonalInfo(userId: string): Promise<PersonalInfoDto> {
    if (!userId) {
      throw new NotFoundException('User not found');
    }

    const user = await this.authRepository.findOne({
      where: { id: userId },
      relations: { oauthAccounts: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const provider = user.oauthAccounts && user.oauthAccounts.length > 0
      ? user.oauthAccounts[0].provider
      : 'local';

    return {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      address: user.address,
      country: user.country,
      state: user.state,
      city: user.city,
      zipCode: user.zipCode,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      weight: user.weight,
      height: user.height,
      dailyGoal: user.dailyGoal,
      isEmailVerified: user.isEmailVerified,
      provider,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updatePersonalInfo(userId: string, updatePersonalInfoDto: Omit<UpdatePersonalInfoDto, 'userId'>): Promise<{ current: PersonalInfoDto; updated: PersonalInfoDto }> {
    if (!userId) {
      throw new NotFoundException('User not found');
    }

    const user = await this.authRepository.findOne({
      where: { id: userId },
      relations: { oauthAccounts: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const provider = user.oauthAccounts && user.oauthAccounts.length > 0
      ? user.oauthAccounts[0].provider
      : 'local';

    // Return current user info first
    const currentInfo: PersonalInfoDto = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      address: user.address,
      country: user.country,
      state: user.state,
      city: user.city,
      zipCode: user.zipCode,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      weight: user.weight,
      height: user.height,
      dailyGoal: user.dailyGoal,
      isEmailVerified: user.isEmailVerified,
      provider,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // Update the user
    Object.assign(user, updatePersonalInfoDto);

    const updatedUser = await this.authRepository.save(user);

    // Return updated user info
    const updatedInfo: PersonalInfoDto = {
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      phoneNumber: updatedUser.phoneNumber,
      address: updatedUser.address,
      country: updatedUser.country,
      state: updatedUser.state,
      city: updatedUser.city,
      zipCode: updatedUser.zipCode,
      dateOfBirth: updatedUser.dateOfBirth,
      gender: updatedUser.gender,
      weight: updatedUser.weight,
      height: updatedUser.height,
      dailyGoal: updatedUser.dailyGoal,
      isEmailVerified: updatedUser.isEmailVerified,
      provider,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    return {
      current: currentInfo,
      updated: updatedInfo,
    };
  }

  async getLoginDetails(userId: string): Promise<LoginDetailsDto> {
    if (!userId) {
      throw new NotFoundException('User not found');
    }

    const user = await this.authRepository.findOne({
      where: { id: userId },
      relations: { oauthAccounts: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const provider = user.oauthAccounts && user.oauthAccounts.length > 0
      ? user.oauthAccounts[0].provider
      : 'local';

    return {
      email: user.email,
      password: '********', // Masked password for security
      isEmailVerified: user.isEmailVerified,
      provider,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getEmailVerificationStatus(userId: string): Promise<EmailVerificationDto> {
    if (!userId) {
      throw new NotFoundException('User not found');
    }

    const user = await this.authRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      userId: user.id,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      verifiedAt: user.emailVerifiedAt,
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    if (!userId) {
      throw new NotFoundException('User not found');
    }

    const user = await this.authRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.password) {
      throw new BadRequestException('Password changes are unavailable for an OAuth-only account');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    // Update password
    await this.authRepository.update(userId, {
      password: hashedPassword,
      refreshToken: null,
    });
  }


  async getNewsletterStatus(userId: string): Promise<NewsletterStatusDto> {
    if (!userId) {
      throw new NotFoundException('User not found');
    }

    await this.ensureUserExists(userId);

    let preference = await this.newsletterRepository.findOne({
      where: { userId },
    });

    if (!preference) {
      preference = await this.newsletterRepository.create({
        userId,
        isSubscribed: false,
        marketingConsent: false,
      });
      await this.newsletterRepository.save(preference);
    }

    return {
      userId: preference.userId,
      isSubscribed: preference.isSubscribed,
      marketingConsent: preference.marketingConsent,
      subscribedAt: preference.subscribedAt,
      consentGivenAt: preference.consentGivenAt,
    };
  }

  async updateNewsletter(userId: string, updateNewsletterDto: UpdateNewsletterDto): Promise<NewsletterStatusDto> {
    const { isSubscribed, marketingConsent } = updateNewsletterDto;
    await this.ensureUserExists(userId);

    let preference = await this.newsletterRepository.findOne({
      where: { userId },
    });

    if (!preference) {
      preference = await this.newsletterRepository.create({
        userId,
        isSubscribed: false,
        marketingConsent: false,
      });
    }

    if (isSubscribed !== undefined) {
      if (isSubscribed && !preference.isSubscribed) {
        preference.isSubscribed = true;
        preference.subscribedAt = new Date();
        preference.unsubscribedAt = null;
      } else if (!isSubscribed && preference.isSubscribed) {
        preference.isSubscribed = false;
        preference.unsubscribedAt = new Date();
      }
    }

    if (marketingConsent !== undefined) {
      if (marketingConsent && !preference.marketingConsent) {
        preference.marketingConsent = true;
        preference.consentGivenAt = new Date();
        preference.consentWithdrawnAt = null;
      } else if (!marketingConsent && preference.marketingConsent) {
        preference.marketingConsent = false;
        preference.consentWithdrawnAt = new Date();
      }
    }

    const updatedPreference = await this.newsletterRepository.save(preference);

    return {
      userId: updatedPreference.userId,
      isSubscribed: updatedPreference.isSubscribed,
      marketingConsent: updatedPreference.marketingConsent,
      subscribedAt: updatedPreference.subscribedAt,
      consentGivenAt: updatedPreference.consentGivenAt,
    };
  }

  private async ensureUserExists(userId: string): Promise<void> {
    const user = await this.authRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
  }
}
