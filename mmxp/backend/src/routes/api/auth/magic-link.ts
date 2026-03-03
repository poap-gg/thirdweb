import { Router } from 'express';
import type { Request, Response } from 'express';
import { AppDataSource } from '../../../config/database';
import { User } from '../../../entities/User';
import { createMagicLink } from '../../../lib/auth';
import { sendMagicLinkEmail, sendWelcomeEmail } from '../../../lib/email';
import { env } from '../../../config/env';
import {
  sendSuccess,
  sendMissingField,
  sendInternalError,
} from '../../../lib/response';

const router = Router();

/**
 * POST /api/auth/magic-link/request
 * Body: { email: string }
 *
 * MVP mode (NODE_ENV !== 'production'):
 *   - Auto-creates the user if they don't exist yet
 *   - Returns { sent: true, verifyUrl } so the frontend can sign in immediately
 *     without needing email delivery configured
 *
 * Production mode:
 *   - User must already exist (created via CSV upload)
 *   - Sends email, returns { sent: true } only (no URL in response)
 */
router.post('/request', async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) return sendMissingField(res, 'email');

    const normalized = email.toLowerCase().trim();
    const repo = AppDataSource.getRepository(User);
    let user = await repo.findOne({ where: { email: normalized } });
    const isNew = !user;

    if (env.isDev) {
      // MVP: auto-create the user so any email works
      if (!user) {
        user = repo.create({
          email: normalized,
          name: normalized.split('@')[0],
          points: 0,
          isAdmin: false,
        });
        await repo.save(user);
      }

      const verifyUrl = await createMagicLink(user.id, user.email);
      // Return the URL directly — frontend redirects without needing email
      sendSuccess(res, { sent: true, verifyUrl });
      return;
    }

    // Production: user must exist via CSV upload; send email normally
    if (!user) {
      // Still return sent:true to avoid email enumeration
      sendSuccess(res, { sent: true });
      return;
    }

    const magicUrl = await createMagicLink(user.id, user.email);
    if (isNew) {
      await sendWelcomeEmail({ to: user.email, name: user.name, magicLinkUrl: magicUrl });
    } else {
      await sendMagicLinkEmail({ to: user.email, name: user.name, magicLinkUrl: magicUrl });
    }

    sendSuccess(res, { sent: true });
  } catch (err) {
    sendInternalError(res, err);
  }
});

export default router;
