import { Controller, Get, Post, Put, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { PersonalInfoDto, PersonalInfoRequestDto, UpdatePersonalInfoDto, PersonalInfoUpdateResponseDto } from '../dto/personal-info.dto';
import { LoginDetailsDto, LoginDetailsRequestDto } from '../dto/login-details.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { NewsletterStatusDto } from '../dto/newsletter-status.dto';
import { UpdateNewsletterDto } from '../dto/update-newsletter.dto';
import { EmailVerificationDto } from '../dto/email-verification.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Auth } from '../../auth/entities/auth.entity';

@ApiTags('User')
@Controller('user')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('personal-info')
  @ApiOperation({ summary: 'Get the current user personal information' })
  @ApiResponse({ status: 200, description: 'Personal information retrieved successfully', type: PersonalInfoDto })
  async getPersonalInfo(@CurrentUser() user: Auth): Promise<PersonalInfoDto> {
    return this.userService.getPersonalInfo(user.id);
  }

  @Put('personal-info')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user personal information' })
  @ApiResponse({ status: 200, description: 'Personal information updated successfully', type: PersonalInfoUpdateResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updatePersonalInfo(@CurrentUser() user: Auth, @Body() updatePersonalInfoDto: UpdatePersonalInfoDto): Promise<PersonalInfoUpdateResponseDto> {
    return this.userService.updatePersonalInfo(user.id, updatePersonalInfoDto);
  }

  @Get('login-details')
  @ApiOperation({ summary: 'Get user login details' })
  @ApiResponse({ status: 200, description: 'Login details retrieved successfully', type: LoginDetailsDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getLoginDetails(@CurrentUser() user: Auth): Promise<LoginDetailsDto> {
    return this.userService.getLoginDetails(user.id);
  }

  @Get('email-verification')
  @ApiOperation({ summary: 'Get email verification status' })
  @ApiResponse({ status: 200, description: 'Email verification status retrieved successfully', type: EmailVerificationDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getEmailVerificationStatus(@CurrentUser() user: Auth): Promise<EmailVerificationDto> {
    return this.userService.getEmailVerificationStatus(user.id);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid password or validation error' })
  @ApiResponse({ status: 401, description: 'Incorrect current password' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async changePassword(@CurrentUser() user: Auth, @Body() changePasswordDto: ChangePasswordDto): Promise<void> {
    await this.userService.changePassword(user.id, changePasswordDto);
  }

  @Get('newsletter-status')
  @ApiOperation({ summary: 'Get newsletter subscription status' })
  @ApiResponse({ status: 200, description: 'Newsletter status retrieved successfully', type: NewsletterStatusDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getNewsletterStatus(@CurrentUser() user: Auth): Promise<NewsletterStatusDto> {
    return this.userService.getNewsletterStatus(user.id);
  }

  @Put('newsletter-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update newsletter subscription preferences' })
  @ApiResponse({ status: 200, description: 'Newsletter preferences updated successfully', type: NewsletterStatusDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateNewsletter(@CurrentUser() user: Auth, @Body() updateNewsletterDto: UpdateNewsletterDto): Promise<NewsletterStatusDto> {
    return this.userService.updateNewsletter(user.id, updateNewsletterDto);
  }

  @Get('consent-history')
  @ApiOperation({ summary: 'Get the current user consent audit history' })
  getConsentHistory(@CurrentUser() user: Auth) {
    return this.userService.getConsentHistory(user.id);
  }

  @Post('newsletter/subscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Subscribe to newsletter' })
  @ApiResponse({ status: 200, description: 'Successfully subscribed to newsletter', type: NewsletterStatusDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async subscribeNewsletter(@CurrentUser() user: Auth): Promise<NewsletterStatusDto> {
    return this.userService.updateNewsletter(user.id, { isSubscribed: true });
  }

  @Post('newsletter/unsubscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsubscribe from newsletter' })
  @ApiResponse({ status: 200, description: 'Successfully unsubscribed from newsletter', type: NewsletterStatusDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async unsubscribeNewsletter(@CurrentUser() user: Auth): Promise<NewsletterStatusDto> {
    return this.userService.updateNewsletter(user.id, { isSubscribed: false });
  }
}
