import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth, getActingUser } from '../../../middleware/auth';
import { store } from '../../../lib/store';
import { encodeId } from '../../../lib/hashids';
import { getCachedUser, setCachedUser } from '../../../lib/cache';
import {
  sendSuccess,
  sendNotFound,
  sendInternalError,
} from '../../../lib/response';
import type { PublicUser, PublicEventHistory, CachedUserData } from '../../../shared-types';

const router = Router();

function buildUserData(userId: number): CachedUserData | null {
  const user = store.users.findById(userId);
  if (!user) return null;

  const rank = store.users.countWithMorePointsThan(user.points) + 1;

  const rawAttendances = store.attendances.findByUser(userId);
  const events: PublicEventHistory[] = rawAttendances
    .map((a) => {
      const event = store.events.findById(a.eventId);
      if (!event) return null;
      return {
        eventId: encodeId(a.eventId),
        eventName: event.name,
        eventDate: (event.eventDate ?? a.createdAt).toISOString(),
        pointsAwarded: a.pointsAwarded,
        checkedIn: a.checkedIn,
      };
    })
    .filter((e): e is PublicEventHistory => e !== null)
    .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

  const publicUser: PublicUser = {
    id: encodeId(user.id),
    name: user.name,
    email: user.email,
    points: user.points,
    rank,
    createdAt: user.createdAt.toISOString(),
  };

  return { user: publicUser, events };
}

/**
 * GET /api/users/me
 * Returns the currently authenticated user's profile + event history.
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getActingUser(req.session.authId)!;

    const cached = await getCachedUser(userId);
    if (cached) {
      sendSuccess(res, cached);
      return;
    }

    const data = buildUserData(userId);
    if (!data) {
      sendNotFound(res, 'User not found');
      return;
    }

    await setCachedUser(userId, data);
    sendSuccess(res, data);
  } catch (err) {
    sendInternalError(res, err);
  }
});

export default router;
