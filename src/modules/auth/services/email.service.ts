import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: parseInt(this.configService.get('SMTP_PORT') || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASSWORD'),
      },
    });
  }

  async sendVerificationEmail(email: string, code: string): Promise<void> {
    const mailOptions = {
      from: this.configService.get('SMTP_FROM') || 'noreply@jekofit.com',
      to: email,
      subject: 'Email Verification - Jekofit',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Thank you for registering with Jekofit!</p>
          <p>Your verification code is:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #007bff;">${code}</span>
          </div>
          <p>This code will expire in 24 hours.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <p style="color: #666; font-size: 12px;">This is an automated email from Jekofit Shopping Platform.</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get('FRONTEND_URL');
    
    const mailOptions = {
      from: this.configService.get('SMTP_FROM') || 'noreply@jekofit.com',
      to: email,
      subject: 'Password Reset - Jekofit',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You requested a password reset for your Jekofit account.</p>
          <p>Your password reset token is:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #007bff;">${token}</span>
          </div>
          <p>Visit <a href="${frontendUrl}" style="color: #007bff;">${frontendUrl}</a> to reset your password using this token.</p>
          <p>This token will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p style="color: #666; font-size: 12px;">This is an automated email from Jekofit Shopping Platform.</p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
