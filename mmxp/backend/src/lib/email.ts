import sgMail from '@sendgrid/mail';
import { env } from '../config/env';

// Initialise SendGrid client with API key
sgMail.setApiKey(env.SENDGRID_KEY);

interface SendWelcomeEmailParams {
  to: string;
  name: string;
  magicLinkUrl: string;
}

interface SendMagicLinkEmailParams {
  to: string;
  name: string;
  magicLinkUrl: string;
}

export async function sendWelcomeEmail(params: SendWelcomeEmailParams): Promise<void> {
  const { to, name, magicLinkUrl } = params;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #1a1a2e; font-size: 28px; margin-bottom: 8px;">Welcome to MMXP! 🎉</h1>
      <p style="color: #4a4a6a; font-size: 16px;">Hi ${name},</p>
      <p style="color: #4a4a6a; font-size: 16px;">
        You've been checked in to an event and earned your first MMXP points. Welcome to the community!
      </p>
      <p style="color: #4a4a6a; font-size: 16px;">
        Click the button below to access your dashboard and see your points and ranking.
      </p>
      <a href="${magicLinkUrl}"
         style="display:inline-block;background:#6c63ff;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;margin:16px 0;">
        View My Dashboard
      </a>
      <p style="color: #9a9ab0; font-size: 13px; margin-top: 24px;">
        This link expires in 24 hours and can only be used once. If you didn't sign up, you can ignore this email.
      </p>
    </div>
  `;

  await sgMail.send({
    to,
    from: { email: env.EMAIL_FROM, name: 'MMXP' },
    subject: 'Welcome to MMXP — View your points!',
    html,
    text: `Welcome to MMXP, ${name}! Click here to view your dashboard: ${magicLinkUrl}`,
  });
}

export async function sendMagicLinkEmail(params: SendMagicLinkEmailParams): Promise<void> {
  const { to, name, magicLinkUrl } = params;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #1a1a2e; font-size: 28px; margin-bottom: 8px;">Your MMXP Sign-In Link</h1>
      <p style="color: #4a4a6a; font-size: 16px;">Hi ${name},</p>
      <p style="color: #4a4a6a; font-size: 16px;">
        Your points have been updated! Click below to sign in and see your latest score.
      </p>
      <a href="${magicLinkUrl}"
         style="display:inline-block;background:#6c63ff;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;margin:16px 0;">
        Sign In to MMXP
      </a>
      <p style="color: #9a9ab0; font-size: 13px; margin-top: 24px;">
        This link expires in 24 hours and can only be used once. If you didn't request this, you can ignore this email.
      </p>
    </div>
  `;

  await sgMail.send({
    to,
    from: { email: env.EMAIL_FROM, name: 'MMXP' },
    subject: 'Your MMXP points have been updated',
    html,
    text: `Hi ${name}, your MMXP points have been updated! Sign in here: ${magicLinkUrl}`,
  });
}
