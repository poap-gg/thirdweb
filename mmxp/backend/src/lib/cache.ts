import { getRedis } from '../config/redis';
import { encodeId } from './hashids';
import type { CachedUserData } from '../shared-types';

const CACHE_TTL_SECONDS = 60 * 60 * 24 * 31; // 31 days

function userCacheKey(userId: number): string {
  return `mmxpUser:${encodeId(userId)}`;
}

export async function getCachedUser(userId: number): Promise<CachedUserData | null> {
  const redis = getRedis();
  const raw = await redis.get(userCacheKey(userId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedUserData;
  } catch {
    return null;
  }
}

export async function setCachedUser(userId: number, data: CachedUserData): Promise<void> {
  const redis = getRedis();
  await redis.setex(userCacheKey(userId), CACHE_TTL_SECONDS, JSON.stringify(data));
}

export async function invalidateCachedUser(userId: number): Promise<void> {
  const redis = getRedis();
  await redis.del(userCacheKey(userId));
}

export async function getCachedLeaderboard(): Promise<unknown | null> {
  const redis = getRedis();
  const raw = await redis.get('mmxp:leaderboard');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function setCachedLeaderboard(data: unknown, ttlSeconds = 300): Promise<void> {
  const redis = getRedis();
  await redis.setex('mmxp:leaderboard', ttlSeconds, JSON.stringify(data));
}

export async function invalidateCachedLeaderboard(): Promise<void> {
  const redis = getRedis();
  await redis.del('mmxp:leaderboard');
}
