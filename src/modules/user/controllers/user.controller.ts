import { Controller, Get, Post, Put, Patch, Delete, Body, HttpCode, HttpStatus, UseGuards, Param, ParseUUIDPipe } from '@nestjs/common';
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
import { CreateDeliveryAddressDto, UpdateDeliveryAddressDto } from '../dto/delivery-address.dto';
import { DeliveryAddressService } from '../services/delivery-address.service';

@ApiTags('User')
@Controller('user')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UserController {
  constructor(private readonly userService: UserService, private readonly deliveryAddresses: DeliveryAddressService) {}

  @Get('delivery-addresses')
  @ApiOperation({ summary: 'List saved delivery addresses' })
  listDeliveryAddresses(@CurrentUser() user: Auth) {
    return this.deliveryAddresses.list(user.id);
  }

  @Post('delivery-addresses')
  @ApiOperation({ summary: 'Save a delivery address' })
  createDeliveryAddress(@CurrentUser() user: Auth, @Body() dto: CreateDeliveryAddressDto) {
    return this.deliveryAddresses.create(user.id, dto);
  }

  @Patch('delivery-addresses/:id')
  @ApiOperation({ summary: 'Update an owned delivery address' })
  updateDeliveryAddress(@CurrentUser() user: Auth, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDeliveryAddressDto) {
    return this.deliveryAddresses.update(user.id, id, dto);
  }

  @Put('delivery-addresses/:id/default')
  @ApiOperation({ summary: 'Set an owned delivery address as default' })
  setDefaultDeliveryAddress(@CurrentUser() user: Auth, @Param('id', ParseUUIDPipe) id: string) {
    return this.deliveryAddresses.setDefault(user.id, id);
  }

  @Delete('delivery-addresses/:id')
  @ApiOperation({ summary: 'Delete an owned delivery address' })
  removeDeliveryAddress(@CurrentUser() user: Auth, @Param('id', ParseUUIDPipe) id: string) {
    return this.deliveryAddresses.remove(user.id, id);
  }

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
