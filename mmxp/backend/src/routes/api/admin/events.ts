import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth, getActingUser } from '../../../middleware/auth';
import { AppDataSource } from '../../../config/database';
import { User } from '../../../entities/User';
import { Event } from '../../../entities/Event';
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

async function assertAdmin(req: Request, res: Response): Promise<User | null> {
  const userId = getActingUser(req.session.authId);
  if (!userId) {
    sendUnauthorized(res);
    return null;
  }
  const user = await AppDataSource.getRepository(User).findOne({ where: { id: userId } });
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
    const admin = await assertAdmin(req, res);
    if (!admin) return;

    const events = await AppDataSource.getRepository(Event)
      .createQueryBuilder('e')
      .orderBy('e.created_at', 'DESC')
      .getMany();

    const result: PublicEvent[] = events.map((e) => ({
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
 * Get a single event with its attendances (admin only).
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const admin = await assertAdmin(req, res);
    if (!admin) return;

    const eventId = decodeId(req.params['id']);
    if (!eventId) {
      sendValidationError(res, 'Invalid event id');
      return;
    }

    const event = await AppDataSource.getRepository(Event).findOne({ where: { id: eventId } });
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
