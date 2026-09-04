/**
 * Email queue constants and job payload types.
 *
 * All outbound emails are dispatched through this queue so that request
 * handlers return immediately — the SMTP round-trip happens asynchronously
 * in a worker process, keeping API latency low and protecting against SMTP
 * timeouts blocking the event loop.
 */

export const EMAIL_QUEUE = 'email';

export enum EmailJobName {
  SEND_VERIFICATION  = 'send-verification',
  SEND_PASSWORD_RESET = 'send-password-reset',
  SEND_WELCOME       = 'send-welcome',
}

// ── Job payload shapes ────────────────────────────────────────────────────────

export interface SendVerificationEmailJob {
  email: string;
  code: string;
}

export interface SendPasswordResetEmailJob {
  email: string;
  token: string;
  frontendUrl: string;
}

export interface SendWelcomeEmailJob {
  email: string;
  firstName?: string;
}
