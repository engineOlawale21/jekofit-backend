/**
 * Cleanup queue constants.
 *
 * Scheduled jobs that purge expired rows from the DB so tables stay lean
 * and stale tokens can never be replayed after their expiry window.
 */

export const CLEANUP_QUEUE = 'cleanup';

export enum CleanupJobName {
  PURGE_EXPIRED_PASSWORD_RESETS    = 'purge-expired-password-resets',
  PURGE_EXPIRED_EMAIL_VERIFICATIONS = 'purge-expired-email-verifications',
  PURGE_STALE_REFRESH_TOKENS       = 'purge-stale-refresh-tokens',
}
