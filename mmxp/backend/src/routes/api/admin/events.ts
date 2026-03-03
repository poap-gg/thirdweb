import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth, getActingUser } from '../../../middleware/auth';
import { store } from '../../../lib/store';
import type { StoreUser } from '../../../lib/store';
import { encodeId, decodeId } from '../../../lib/hashids';
import {
  sendSuccess,
  sendNotFound,
  sendUnauthorized,
  sendInternalError,
  sendValidationError,
} from '../../../lib/response';
import type { PublicEvent } from '../../../shared-types';

const router = Router();

function assertAdmin(req: Request, res: Response): StoreUser | null {
  const userId = getActingUser(req.session.authId);
  if (!userId) {
    sendUnauthorized(res);
    return null;
  }
  const user = store.users.findById(userId);
  if (!user || !user.isAdmin) {
    sendUnauthorized(res, 'Admin access required');
    return null;
  }
  return user;
}

/**
 * GET /api/admin/events
 * List all events (admin only).
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const admin = assertAdmin(req, res);
    if (!admin) return;

    const result: PublicEvent[] = store.events.listDesc().map((e) => ({
      id: encodeId(e.id),
      name: e.name,
      date: e.eventDate?.toISOString() ?? '',
      attendeeCount: e.attendeeCount,
      createdAt: e.createdAt.toISOString(),
    }));

    sendSuccess(res, result);
  } catch (err) {
    sendInternalError(res, err);
  }
});

/**
 * GET /api/admin/events/:id
 * Get a single event (admin only).
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const admin = assertAdmin(req, res);
    if (!admin) return;

    const eventId = decodeId(req.params['id']);
    if (!eventId) {
      sendValidationError(res, 'Invalid event id');
      return;
    }

    const event = store.events.findById(eventId);
    if (!event) {
      sendNotFound(res, 'Event not found');
      return;
    }

    sendSuccess(res, {
      id: encodeId(event.id),
      name: event.name,
      date: event.eventDate?.toISOString() ?? '',
      attendeeCount: event.attendeeCount,
      createdAt: event.createdAt.toISOString(),
    });
  } catch (err) {
    sendInternalError(res, err);
  }
});

export default router;
