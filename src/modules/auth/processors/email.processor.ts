import { Processor, Process, OnQueueFailed, OnQueueStalled } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EmailService } from '../services/email.service';
import {
  EMAIL_QUEUE,
  EmailJobName,
  SendVerificationEmailJob,
  SendPasswordResetEmailJob,
  SendWelcomeEmailJob,
} from '../queues/email.queue';

/**
 * EmailProcessor
 *
 * Runs in a Bull worker and handles all outbound emails asynchronously.
 * Because emails are processed outside the request lifecycle:
 *   - API handlers return instantly (no SMTP latency blocking responses)
 *   - Bull automatically retries on SMTP failure (3 attempts, backoff)
 *   - Failed jobs are preserved in Redis for inspection / manual replay
 */
@Processor(EMAIL_QUEUE)
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {}

  // ── Handlers ──────────────────────────────────────────────────────────────

  @Process(EmailJobName.SEND_VERIFICATION)
  async handleSendVerification(job: Job<SendVerificationEmailJob>) {
    const { email, code } = job.data;
    this.logger.debug(`[email-queue] Sending verification email to ${email}`);
    await this.emailService.sendVerificationEmail(email, code);
    this.logger.log(`[email-queue] Verification email delivered to ${email}`);
  }

  @Process(EmailJobName.SEND_PASSWORD_RESET)
  async handleSendPasswordReset(job: Job<SendPasswordResetEmailJob>) {
    const { email, token, frontendUrl } = job.data;
    this.logger.debug(`[email-queue] Sending password-reset email to ${email}`);
    await this.emailService.sendPasswordResetEmail(email, token, frontendUrl);
    this.logger.log(`[email-queue] Password-reset email delivered to ${email}`);
  }

  @Process(EmailJobName.SEND_WELCOME)
  async handleSendWelcome(job: Job<SendWelcomeEmailJob>) {
    const { email, firstName } = job.data;
    this.logger.debug(`[email-queue] Sending welcome email to ${email}`);
    await this.emailService.sendWelcomeEmail(email, firstName);
    this.logger.log(`[email-queue] Welcome email delivered to ${email}`);
  }

  // ── Error hooks ───────────────────────────────────────────────────────────

  @OnQueueFailed()
  onFailed(job: Job, err: Error) {
    this.logger.error(
      `[email-queue] Job ${job.name}#${job.id} failed (attempt ${job.attemptsMade}/${job.opts.attempts}): ${err.message}`,
    );
  }

  @OnQueueStalled()
  onStalled(job: Job) {
    this.logger.warn(`[email-queue] Job ${job.name}#${job.id} stalled — will be retried`);
  }
}
