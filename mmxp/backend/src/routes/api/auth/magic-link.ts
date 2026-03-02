import { Router } from 'express';
import type { Request, Response } from 'express';
import { AppDataSource } from '../../../config/database';
import { User } from '../../../entities/User';
import { createMagicLink } from '../../../lib/auth';
import { sendMagicLinkEmail, sendWelcomeEmail } from '../../../lib/email';
import {
  sendSuccess,
  sendMissingField,
  sendInternalError,
  sendNotFound,
} from '../../../lib/response';

const router = Router();

/**
 * POST /api/auth/magic-link/request
 * Body: { email: string }
 * Public — sends a magic link to the given email if the user exists.
 * Returns success regardless to avoid email enumeration.
 */
router.post('/request', async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) return sendMissingField(res, 'email');

    const normalized = email.toLowerCase().trim();
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({ where: { email: normalized } });

    // Return success regardless (no email enumeration)
    if (!user) {
      sendSuccess(res, { sent: true });
      return;
    }

    const magicUrl = await createMagicLink(user.id, user.email);
    await sendMagicLinkEmail({ to: user.email, name: user.name, magicLinkUrl: magicUrl });

    sendSuccess(res, { sent: true });
  } catch (err) {
    sendInternalError(res, err);
  }
});

export default router;
