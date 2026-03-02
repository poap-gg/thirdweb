import { Router } from 'express';
import type { Request, Response } from 'express';
import { AppDataSource } from '../../../config/database';
import { User } from '../../../entities/User';
import { encodeId } from '../../../lib/hashids';
import { getCachedLeaderboard, setCachedLeaderboard } from '../../../lib/cache';
import { sendSuccess, sendInternalError } from '../../../lib/response';
import type { LeaderboardEntry } from '../../../shared-types';

const router = Router();

const PAGE_SIZE = 50;

/**
 * GET /api/leaderboard
 * Public leaderboard, top 50 users by points. Cached for 5 minutes.
 * Query params: ?page=1
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt((req.query['page'] as string) ?? '1', 10));
    const cacheKey = page === 1 ? 'mmxp:leaderboard' : null;

    if (cacheKey) {
      const cached = await getCachedLeaderboard();
      if (cached) {
        sendSuccess(res, cached);
        return;
      }
    }

    const offset = (page - 1) * PAGE_SIZE;

    const users = await AppDataSource.getRepository(User)
      .createQueryBuilder('u')
      .select(['u.id', 'u.name', 'u.points'])
      .where('u.points > 0')
      .orderBy('u.points', 'DESC')
      .addOrderBy('u.created_at', 'ASC')
      .skip(offset)
      .take(PAGE_SIZE)
      .getMany();

    const entries: LeaderboardEntry[] = users.map((u, idx) => ({
      rank: offset + idx + 1,
      id: encodeId(u.id),
      name: u.name,
      points: u.points,
    }));

    const result = { entries, page, pageSize: PAGE_SIZE };

    if (cacheKey) {
      await setCachedLeaderboard(result, 300); // 5-minute cache
    }

    sendSuccess(res, result);
  } catch (err) {
    sendInternalError(res, err);
  }
});

export default router;
