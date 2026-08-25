import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes, randomInt } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { Auth } from '../entities/auth.entity';
import { PasswordReset } from '../entities/password-reset.entity';
import { EmailVerification } from '../entities/email-verification.entity';
import { RegisterDto } from '../dto/register.dto';
import { RegisterPersonalInfoDto } from '../dto/register-personal-info.dto';
import { LoginDto } from '../dto/login.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Auth)
    private readonly authRepository: Repository<Auth>,
    @InjectRepository(PasswordReset)
    private readonly passwordResetRepository: Repository<PasswordReset>,
    @InjectRepository(EmailVerification)
    private readonly emailVerificationRepository: Repository<EmailVerification>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<void> {
    const email = this.normalizeEmail(registerDto.email);
    await this.ensureEmailIsAvailable(email);
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const auth = this.authRepository.create({
      email,
      password: hashedPassword,
    });

    const savedAuth = await this.authRepository.save(auth);
    await this.sendVerificationEmail(savedAuth.id);
  }

  async registerWithPersonalInfo(registerPersonalInfoDto: RegisterPersonalInfoDto): Promise<Auth> {
    const email = this.normalizeEmail(registerPersonalInfoDto.email);
    await this.ensureEmailIsAvailable(email);
    const hashedPassword = await bcrypt.hash(registerPersonalInfoDto.password, 10);

    const auth = this.authRepository.create({
      email,
      password: hashedPassword,
      firstName: registerPersonalInfoDto.firstName,
      lastName: registerPersonalInfoDto.lastName,
      phoneNumber: registerPersonalInfoDto.phoneNumber,
      address: registerPersonalInfoDto.address,
      country: registerPersonalInfoDto.country,
      state: registerPersonalInfoDto.state,
      city: registerPersonalInfoDto.city,
      zipCode: registerPersonalInfoDto.zipCode,
    });

    const savedAuth = await this.authRepository.save(auth);
    await this.sendVerificationEmail(savedAuth.id);
    return savedAuth;
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    const auth = await this.authRepository.findOne({
      where: { email: this.normalizeEmail(loginDto.email) },
    });

    if (!auth) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, auth.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!auth.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    const tokens = await this.generateTokens(auth);
    
    await this.authRepository.update(auth.id, { refreshToken: tokens.refreshToken });

    return tokens;
  }

  async validateUser(userId: string): Promise<Auth> {
    const auth = await this.authRepository.findOne({
      where: { id: userId },
    });

    if (!auth) {
      throw new UnauthorizedException('User not found');
    }

    return auth;
  }

  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const auth = await this.authRepository.findOne({
      where: { refreshToken },
    });

    if (!auth) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(auth);
    
    await this.authRepository.update(auth.id, { refreshToken: tokens.refreshToken });

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.authRepository.update(userId, { refreshToken: null });
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const auth = await this.authRepository.findOne({
      where: { email: this.normalizeEmail(forgotPasswordDto.email) },
    });

    if (!auth) {
      throw new BadRequestException('User with this email does not exist');
    }

    // Delete any existing reset tokens for this user
    await this.passwordResetRepository.delete({ userId: auth.id });

    // Generate new reset token
    const token = this.generateResetToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    const passwordReset = this.passwordResetRepository.create({
      token: this.hashToken(token),
      expiresAt,
      user: auth,
      userId: auth.id,
    });

    await this.passwordResetRepository.save(passwordReset);

    // Send email with reset token
    await this.emailService.sendPasswordResetEmail(auth.email, token);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const passwordReset = await this.passwordResetRepository.findOne({
      where: { token: this.hashToken(resetPasswordDto.token) },
      relations: {
        user: true,
      },
    });

    if (!passwordReset) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (passwordReset.isUsed) {
      throw new BadRequestException('Reset token has already been used');
    }

    if (passwordReset.expiresAt < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    await this.authRepository.update(passwordReset.userId, {
      password: hashedPassword,
      refreshToken: null,
    });

    await this.passwordResetRepository.update(passwordReset.id, { isUsed: true });
  }

  private async generateTokens(auth: Auth): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: auth.id, email: auth.email };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '30d',
    });

    return { accessToken, refreshToken };
  }

  private generateResetToken(): string {
    return randomBytes(32).toString('hex');
  }

  async sendVerificationEmail(userId: string): Promise<void> {
    const auth = await this.authRepository.findOne({
      where: { id: userId },
    });

    if (!auth) {
      throw new BadRequestException('User not found');
    }

    if (auth.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Delete any existing verification codes for this user
    await this.emailVerificationRepository.delete({ userId: auth.id });

    // Generate 6-digit verification code
    const code = this.generateVerificationCode();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Code expires in 24 hours

    const emailVerification = this.emailVerificationRepository.create({
      code,
      expiresAt,
      user: auth,
      userId: auth.id,
    });

    await this.emailVerificationRepository.save(emailVerification);

    // Send email with verification code
    await this.emailService.sendVerificationEmail(auth.email, code);
  }

  async sendVerificationEmailByEmail(email: string): Promise<void> {
    const auth = await this.authRepository.findOne({
      where: { email: this.normalizeEmail(email) },
    });

    if (!auth) {
      throw new BadRequestException('User not found');
    }

    if (auth.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Delete any existing verification codes for this user
    await this.emailVerificationRepository.delete({ userId: auth.id });

    // Generate 6-digit verification code
    const code = this.generateVerificationCode();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Code expires in 24 hours

    const emailVerification = this.emailVerificationRepository.create({
      code,
      expiresAt,
      user: auth,
      userId: auth.id,
    });

    await this.emailVerificationRepository.save(emailVerification);

    // Send email with verification code
    await this.emailService.sendVerificationEmail(auth.email, code);
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<void> {
    const emailVerification = await this.emailVerificationRepository.findOne({
      where: { code: verifyEmailDto.code },
      relations: {
        user: true,
      },
    });

    if (!emailVerification) {
      throw new BadRequestException('Invalid verification code');
    }

    if (emailVerification.isUsed) {
      throw new BadRequestException('Verification code has already been used');
    }

    if (emailVerification.expiresAt < new Date()) {
      throw new BadRequestException('Verification code has expired');
    }

    await this.authRepository.update(emailVerification.userId, {
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    });

    await this.emailVerificationRepository.update(emailVerification.id, { isUsed: true });
  }

  private generateVerificationCode(): string {
    return randomInt(100000, 1_000_000).toString();
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async ensureEmailIsAvailable(email: string): Promise<void> {
    const existingAuth = await this.authRepository.findOne({ where: { email } });
    if (existingAuth) {
      throw new ConflictException('An account with this email already exists');
    }
  }
}
