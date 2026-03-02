import { Router } from 'express';
import type { Request, Response } from 'express';
import { AppDataSource } from '../../../config/database';
import { User } from '../../../entities/User';
import { Attendance } from '../../../entities/Attendance';
import { Event } from '../../../entities/Event';
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

    const userRepo = AppDataSource.getRepository(User);
    const attendRepo = AppDataSource.getRepository(Attendance);

    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) {
      sendNotFound(res, 'Profile not found');
      return;
    }

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
      .andWhere('a.checked_in = true')
      .orderBy('e.event_date', 'DESC')
      .getMany();

    const events: PublicEventHistory[] = attendances.map((a) => ({
      eventId: encodeId(a.eventId),
      eventName: (a.event as Event).name,
      eventDate: ((a.event as Event).eventDate ?? a.createdAt).toISOString(),
      pointsAwarded: a.pointsAwarded,
      checkedIn: a.checkedIn,
    }));

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
