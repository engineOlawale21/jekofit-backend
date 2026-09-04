import { Processor, Process } from '@nestjs/bull';
import { Logger, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { PasswordReset } from '../entities/password-reset.entity';
import { EmailVerification } from '../entities/email-verification.entity';
import { Auth } from '../entities/auth.entity';
import {
  CLEANUP_QUEUE,
  CleanupJobName,
} from '../queues/cleanup.queue';

/**
 * CleanupProcessor
 *
 * Two responsibilities:
 *   1. Scheduled cron (via @nestjs/schedule) that enqueues cleanup jobs
 *      at regular intervals — no extra Redis polling needed.
 *   2. Bull processors that execute the actual DELETE queries when jobs fire.
 *
 * Why background jobs for cleanup?
 *   - Keeps cleanup out of the hot request path
 *   - Retried automatically on DB hiccup
 *   - Easily adjustable rate without touching business logic
 *   - Logged and observable in Bull dashboard
 */
@Injectable()
@Processor(CLEANUP_QUEUE)
export class CleanupProcessor {
  private readonly logger = new Logger(CleanupProcessor.name);

  constructor(
    @InjectQueue(CLEANUP_QUEUE)
    private readonly cleanupQueue: Queue,

    @InjectRepository(PasswordReset)
    private readonly passwordResetRepository: Repository<PasswordReset>,

    @InjectRepository(EmailVerification)
    private readonly emailVerificationRepository: Repository<EmailVerification>,

    @InjectRepository(Auth)
    private readonly authRepository: Repository<Auth>,
  ) {}

  // ── Cron: enqueue jobs on schedule ───────────────────────────────────────

  /** Every day at 02:00 AM — low-traffic window */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduleNightlyCleanup() {
    this.logger.log('[cleanup-cron] Scheduling nightly cleanup jobs');
    await Promise.all([
      this.cleanupQueue.add(CleanupJobName.PURGE_EXPIRED_PASSWORD_RESETS, {}, {
        removeOnComplete: true,
        removeOnFail: false, // keep failed jobs for inspection
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
      }),
      this.cleanupQueue.add(CleanupJobName.PURGE_EXPIRED_EMAIL_VERIFICATIONS, {}, {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
      }),
      this.cleanupQueue.add(CleanupJobName.PURGE_STALE_REFRESH_TOKENS, {}, {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
      }),
    ]);
  }

  // ── Bull processors ───────────────────────────────────────────────────────

  @Process(CleanupJobName.PURGE_EXPIRED_PASSWORD_RESETS)
  async purgeExpiredPasswordResets() {
    const cutoff = new Date();
    const result = await this.passwordResetRepository.delete({
      expiresAt: LessThan(cutoff),
    });
    this.logger.log(
      `[cleanup] Purged ${result.affected ?? 0} expired password reset record(s)`,
    );
  }

  @Process(CleanupJobName.PURGE_EXPIRED_EMAIL_VERIFICATIONS)
  async purgeExpiredEmailVerifications() {
    const cutoff = new Date();
    const result = await this.emailVerificationRepository.delete({
      expiresAt: LessThan(cutoff),
    });
    this.logger.log(
      `[cleanup] Purged ${result.affected ?? 0} expired email verification record(s)`,
    );
  }

  /**
   * Nullify refresh tokens for accounts that haven't refreshed in 45 days.
   * These are effectively abandoned sessions — clearing them prevents
   * token leakage if the DB is ever dumped.
   */
  @Process(CleanupJobName.PURGE_STALE_REFRESH_TOKENS)
  async purgeStaleRefreshTokens() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 45); // 45-day inactivity window

    const result = await this.authRepository
      .createQueryBuilder()
      .update(Auth)
      .set({ refreshToken: null })
      .where('refreshToken IS NOT NULL AND updatedAt < :cutoff', { cutoff })
      .execute();

    this.logger.log(
      `[cleanup] Nullified ${result.affected ?? 0} stale refresh token(s)`,
    );
  }
}
