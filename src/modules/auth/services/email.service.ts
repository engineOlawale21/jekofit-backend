import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * EmailService
 *
 * Thin wrapper around nodemailer. All methods are called from background
 * processors (EmailProcessor), never directly from request handlers.
 * This means SMTP latency never blocks the API response.
 */
@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: parseInt(this.configService.get('SMTP_PORT') || '587'),
      secure: parseInt(this.configService.get('SMTP_PORT') || '587') === 465,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASSWORD'),
      },
      // Prevent one slow send from hanging the worker
      connectionTimeout: 10_000,
      greetingTimeout: 8_000,
    });
  }

  // ── Public send methods ───────────────────────────────────────────────────

  async sendVerificationEmail(email: string, code: string): Promise<void> {
    await this.send({
      to: email,
      subject: 'Verify your Jekofit email',
      html: this.verificationTemplate(code),
    });
  }

  async sendPasswordResetEmail(
    email: string,
    token: string,
    frontendUrl?: string,
  ): Promise<void> {
    const base = frontendUrl ?? this.configService.get('FRONTEND_URL') ?? 'http://localhost:3000';
    await this.send({
      to: email,
      subject: 'Reset your Jekofit password',
      html: this.passwordResetTemplate(token, base),
    });
  }

  async sendWelcomeEmail(email: string, firstName?: string): Promise<void> {
    await this.send({
      to: email,
      subject: 'Welcome to Jekofit 🎉',
      html: this.welcomeTemplate(firstName),
    });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async send(options: { to: string; subject: string; html: string }) {
    // Skip in test / when SMTP is not configured
    if (
      process.env.NODE_ENV === 'test' ||
      !this.configService.get('SMTP_USER')
    ) {
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM') || 'noreply@jekofit.com',
        ...options,
      });
    } catch (error) {
      // Re-throw so Bull can retry the job
      throw new Error(`SMTP error: ${(error as Error).message}`);
    }
  }

  // ── HTML templates ────────────────────────────────────────────────────────

  private verificationTemplate(code: string): string {
    return `
      <div style="font-family:Inter,Arial,sans-serif;max-width:540px;margin:0 auto;background:#09090b;color:#fff;border-radius:12px;overflow:hidden">
        <div style="background:#ffac00;padding:28px 32px">
          <h1 style="margin:0;font-size:22px;font-weight:900;color:#09090b;letter-spacing:-0.02em">jekofit</h1>
        </div>
        <div style="padding:36px 32px">
          <h2 style="font-size:20px;font-weight:700;margin:0 0 8px">Verify your email</h2>
          <p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:0 0 28px">
            Enter this code in the Jekofit app to verify your email address.
          </p>
          <div style="background:#141418;border:1px solid #32323f;border-radius:10px;padding:24px;text-align:center;margin-bottom:28px">
            <span style="font-size:38px;font-weight:900;letter-spacing:10px;color:#ffac00">${code}</span>
          </div>
          <p style="color:#6b7280;font-size:12px;margin:0">
            This code expires in 24 hours. If you did not create a Jekofit account, you can safely ignore this email.
          </p>
        </div>
        <div style="background:#0f0f12;padding:16px 32px;border-top:1px solid #1a1a21">
          <p style="color:#6b7280;font-size:11px;margin:0">© ${new Date().getFullYear()} Jekofit. All rights reserved.</p>
        </div>
      </div>
    `;
  }

  private passwordResetTemplate(token: string, frontendUrl: string): string {
    const resetUrl = `${frontendUrl}/reset-password`;
    return `
      <div style="font-family:Inter,Arial,sans-serif;max-width:540px;margin:0 auto;background:#09090b;color:#fff;border-radius:12px;overflow:hidden">
        <div style="background:#ffac00;padding:28px 32px">
          <h1 style="margin:0;font-size:22px;font-weight:900;color:#09090b;letter-spacing:-0.02em">jekofit</h1>
        </div>
        <div style="padding:36px 32px">
          <h2 style="font-size:20px;font-weight:700;margin:0 0 8px">Reset your password</h2>
          <p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:0 0 28px">
            Use the token below on the password reset page, or click the button. This token expires in 1 hour.
          </p>
          <div style="background:#141418;border:1px solid #32323f;border-radius:10px;padding:20px;text-align:center;margin-bottom:20px">
            <span style="font-size:16px;font-weight:700;letter-spacing:2px;color:#ffac00;word-break:break-all">${token}</span>
          </div>
          <a href="${resetUrl}" style="display:block;background:#ffac00;color:#09090b;text-align:center;padding:14px 24px;border-radius:999px;font-weight:800;font-size:15px;text-decoration:none;margin-bottom:28px">
            Reset Password
          </a>
          <p style="color:#6b7280;font-size:12px;margin:0">
            If you did not request a password reset, please ignore this email. Your password will remain unchanged.
          </p>
        </div>
        <div style="background:#0f0f12;padding:16px 32px;border-top:1px solid #1a1a21">
          <p style="color:#6b7280;font-size:11px;margin:0">© ${new Date().getFullYear()} Jekofit. All rights reserved.</p>
        </div>
      </div>
    `;
  }

  private welcomeTemplate(firstName?: string): string {
    const name = firstName ?? 'there';
    return `
      <div style="font-family:Inter,Arial,sans-serif;max-width:540px;margin:0 auto;background:#09090b;color:#fff;border-radius:12px;overflow:hidden">
        <div style="background:#ffac00;padding:28px 32px">
          <h1 style="margin:0;font-size:22px;font-weight:900;color:#09090b;letter-spacing:-0.02em">jekofit</h1>
        </div>
        <div style="padding:36px 32px">
          <h2 style="font-size:20px;font-weight:700;margin:0 0 8px">Welcome, ${name}! 🎉</h2>
          <p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:0 0 28px">
            Your account is all set. At Jekofit we create unique styles just for you — custom designs on t-shirts, caps, bags, and more.
          </p>
          <a href="${this.configService.get('FRONTEND_URL') ?? 'http://localhost:3000'}/shop" style="display:block;background:#ffac00;color:#09090b;text-align:center;padding:14px 24px;border-radius:999px;font-weight:800;font-size:15px;text-decoration:none;margin-bottom:28px">
            Start Shopping
          </a>
        </div>
        <div style="background:#0f0f12;padding:16px 32px;border-top:1px solid #1a1a21">
          <p style="color:#6b7280;font-size:11px;margin:0">© ${new Date().getFullYear()} Jekofit. All rights reserved.</p>
        </div>
      </div>
    `;
  }
}
