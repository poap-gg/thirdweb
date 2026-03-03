import { Router } from 'express';
import type { Request, Response } from 'express';
import { store } from '../../../lib/store';
import { encodeId, decodeId } from '../../../lib/hashids';
import { sendSuccess, sendNotFound, sendInternalError, sendValidationError } from '../../../lib/response';
import type { PublicProfile, PublicEventHistory } from '../../../shared-types';

const router = Router();

/**
 * GET /api/users/profile/:id
 * Public shareable user profile.
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = decodeId(id);
    if (!userId) {
      sendValidationError(res, 'Invalid user id');
      return;
    }

    const user = store.users.findById(userId);
    if (!user) {
      sendNotFound(res, 'Profile not found');
      return;
    }

    const rank = store.users.countWithMorePointsThan(user.points) + 1;

    const events: PublicEventHistory[] = store.attendances
      .findByUser(userId)
      .filter((a) => a.checkedIn)
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

    const profile: PublicProfile = {
      id: encodeId(user.id),
      name: user.name,
      points: user.points,
      rank,
      events,
    };

    sendSuccess(res, profile);
  } catch (err) {
    sendInternalError(res, err);
  }
});

export default router;
