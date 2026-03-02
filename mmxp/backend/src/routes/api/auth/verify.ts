import { Router } from 'express';
import type { Request, Response } from 'express';
import { consumeMagicLink } from '../../../lib/auth';
import { AppDataSource } from '../../../config/database';
import { User } from '../../../entities/User';
import { sendSuccess, sendError, sendInternalError } from '../../../lib/response';
import { ErrorCode } from '../../../shared-types';

const router = Router();

/**
 * POST /api/auth/verify
 * Body: { token: string }
 * Verifies a magic link token, sets session, returns user info.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { token } = req.body as { token?: string };
    if (!token) {
      sendError(res, ErrorCode.MISSING_REQUIRED_FIELD, 'Missing token', 422);
      return;
    }

    const result = await consumeMagicLink(token);
    if (!result) {
      sendError(res, ErrorCode.SESSION_EXPIRED, 'Invalid or expired magic link', 401);
      return;
    }

    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({ where: { id: result.userId } });
    if (!user) {
      sendError(res, ErrorCode.NOT_FOUND, 'User not found', 404);
      return;
    }

    req.session.authId = user.id;

    sendSuccess(res, { authenticated: true });
  } catch (err) {
    sendInternalError(res, err);
  }
});

/**
 * POST /api/auth/logout
 * Destroys the MMXP session cookie.
 */
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) console.error('[MMXP] Session destroy error:', err);
    res.clearCookie('mmxp_session');
    sendSuccess(res, { loggedOut: true });
  });
});

export default router;
