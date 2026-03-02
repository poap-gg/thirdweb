import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth, getActingUser } from '../../../middleware/auth';
import { AppDataSource } from '../../../config/database';
import { User } from '../../../entities/User';
import { Attendance } from '../../../entities/Attendance';
import { Event } from '../../../entities/Event';
import { encodeId } from '../../../lib/hashids';
import { getCachedUser, setCachedUser } from '../../../lib/cache';
import {
  sendSuccess,
  sendNotFound,
  sendInternalError,
  sendUnauthorized,
} from '../../../lib/response';
import type { PublicUser, PublicEventHistory, CachedUserData } from '../../../shared-types';

const router = Router();

async function buildUserData(userId: number): Promise<CachedUserData | null> {
  const userRepo = AppDataSource.getRepository(User);
  const attendRepo = AppDataSource.getRepository(Attendance);

  const user = await userRepo.findOne({ where: { id: userId } });
  if (!user) return null;

  // Compute rank: count users with strictly more points
  const { count } = await userRepo
    .createQueryBuilder('u')
    .select('COUNT(*)', 'count')
    .where('u.points > :points', { points: user.points })
    .getRawOne<{ count: string }>();
  const rank = parseInt(count, 10) + 1;

  const attendances = await attendRepo
    .createQueryBuilder('a')
    .innerJoinAndSelect('a.event', 'e')
    .where('a.user_id = :userId', { userId })
    .orderBy('e.event_date', 'DESC')
    .getMany();

  const publicUser: PublicUser = {
    id: encodeId(user.id),
    name: user.name,
    email: user.email,
    points: user.points,
    rank,
    createdAt: user.createdAt.toISOString(),
  };

  const events: PublicEventHistory[] = attendances.map((a) => ({
    eventId: encodeId(a.eventId),
    eventName: (a.event as Event).name,
    eventDate: ((a.event as Event).eventDate ?? a.createdAt).toISOString(),
    pointsAwarded: a.pointsAwarded,
    checkedIn: a.checkedIn,
  }));

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

    const data = await buildUserData(userId);
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
