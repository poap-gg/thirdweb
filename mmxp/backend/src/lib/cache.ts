import { store } from './store';
import { encodeId } from './hashids';
import type { CachedUserData } from '../shared-types';

const CACHE_TTL_SECONDS = 60 * 60 * 24 * 31; // 31 days

function userCacheKey(userId: number): string {
  return `mmxpUser:${encodeId(userId)}`;
}

export async function getCachedUser(userId: number): Promise<CachedUserData | null> {
  return store.cache.get(userCacheKey(userId)) as CachedUserData | null;
}

export async function setCachedUser(userId: number, data: CachedUserData): Promise<void> {
  store.cache.set(userCacheKey(userId), data, CACHE_TTL_SECONDS);
}

export async function invalidateCachedUser(userId: number): Promise<void> {
  store.cache.del(userCacheKey(userId));
}

export async function getCachedLeaderboard(): Promise<unknown | null> {
  return store.cache.get('mmxp:leaderboard');
}

export async function setCachedLeaderboard(data: unknown, ttlSeconds = 300): Promise<void> {
  store.cache.set('mmxp:leaderboard', data, ttlSeconds);
}

export async function invalidateCachedLeaderboard(): Promise<void> {
  store.cache.del('mmxp:leaderboard');
}
