/**
 * In-memory data store for MVP development.
 * Replaces Postgres (TypeORM) and Redis — no infrastructure setup required.
 * Data lives for the lifetime of the process (resets on restart).
 */

let userIdSeq = 1;
let eventIdSeq = 1;
let attendanceIdSeq = 1;
let magicLinkIdSeq = 1;

export interface StoreUser {
  id: number;
  email: string;
  name: string;
  points: number;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreEvent {
  id: number;
  name: string;
  lumaEventId: string | null;
  eventDate: Date | null;
  attendeeCount: number;
  csvFilename: string | null;
  uploadedBy: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreAttendance {
  id: number;
  userId: number;
  eventId: number;
  checkedIn: boolean;
  pointsAwarded: number;
  createdAt: Date;
}

export interface StoreMagicLink {
  id: number;
  userId: number;
  nonce: string;
  used: boolean;
  expiresAt: Date;
  createdAt: Date;
}

// ── Internal maps ─────────────────────────────────────────────────────────────
const users = new Map<number, StoreUser>();
const events = new Map<number, StoreEvent>();
const attendances = new Map<number, StoreAttendance>();
const magicLinks = new Map<number, StoreMagicLink>();
const magicLinksByNonce = new Map<string, StoreMagicLink>();

// ── Simple in-memory cache (replaces Redis) ───────────────────────────────────
interface CacheEntry { value: unknown; expiresAt: number | null }
const cacheStore = new Map<string, CacheEntry>();

// ── Store API ─────────────────────────────────────────────────────────────────
export const store = {
  users: {
    findByEmail(email: string): StoreUser | null {
      for (const u of users.values()) {
        if (u.email === email) return u;
      }
      return null;
    },

    findById(id: number): StoreUser | null {
      return users.get(id) ?? null;
    },

    save(data: Partial<StoreUser> & { email: string; name: string }): StoreUser {
      const now = new Date();
      if (data.id && users.has(data.id)) {
        const updated = { ...users.get(data.id)!, ...data, updatedAt: now };
        users.set(updated.id, updated);
        return updated;
      }
      const user: StoreUser = {
        id: userIdSeq++,
        email: data.email,
        name: data.name,
        points: data.points ?? 0,
        isAdmin: data.isAdmin ?? false,
        createdAt: data.createdAt ?? now,
        updatedAt: now,
      };
      users.set(user.id, user);
      return user;
    },

    countWithMorePointsThan(points: number): number {
      let count = 0;
      for (const u of users.values()) {
        if (u.points > points) count++;
      }
      return count;
    },

    leaderboard(offset: number, limit: number): StoreUser[] {
      return [...users.values()]
        .filter((u) => u.points > 0)
        .sort((a, b) => b.points - a.points || a.createdAt.getTime() - b.createdAt.getTime())
        .slice(offset, offset + limit);
    },
  },

  events: {
    findById(id: number): StoreEvent | null {
      return events.get(id) ?? null;
    },

    save(data: Partial<StoreEvent> & { name: string }): StoreEvent {
      const now = new Date();
      if (data.id && events.has(data.id)) {
        const updated = { ...events.get(data.id)!, ...data, updatedAt: now };
        events.set(updated.id, updated);
        return updated;
      }
      const event: StoreEvent = {
        id: eventIdSeq++,
        name: data.name,
        lumaEventId: data.lumaEventId ?? null,
        eventDate: data.eventDate ?? null,
        attendeeCount: data.attendeeCount ?? 0,
        csvFilename: data.csvFilename ?? null,
        uploadedBy: data.uploadedBy ?? null,
        createdAt: data.createdAt ?? now,
        updatedAt: now,
      };
      events.set(event.id, event);
      return event;
    },

    listDesc(): StoreEvent[] {
      return [...events.values()].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },
  },

  attendances: {
    findByUserAndEvent(userId: number, eventId: number): StoreAttendance | null {
      for (const a of attendances.values()) {
        if (a.userId === userId && a.eventId === eventId) return a;
      }
      return null;
    },

    findByUser(userId: number): StoreAttendance[] {
      return [...attendances.values()].filter((a) => a.userId === userId);
    },

    save(data: Partial<StoreAttendance> & { userId: number; eventId: number }): StoreAttendance {
      const now = new Date();
      if (data.id && attendances.has(data.id)) {
        const updated = { ...attendances.get(data.id)!, ...data };
        attendances.set(updated.id, updated);
        return updated;
      }
      const attendance: StoreAttendance = {
        id: attendanceIdSeq++,
        userId: data.userId,
        eventId: data.eventId,
        checkedIn: data.checkedIn ?? false,
        pointsAwarded: data.pointsAwarded ?? 0,
        createdAt: data.createdAt ?? now,
      };
      attendances.set(attendance.id, attendance);
      return attendance;
    },
  },

  magicLinks: {
    findUnusedByNonce(nonce: string): StoreMagicLink | null {
      const link = magicLinksByNonce.get(nonce);
      if (!link || link.used) return null;
      return link;
    },

    save(data: Partial<StoreMagicLink> & { userId: number; nonce: string; expiresAt: Date }): StoreMagicLink {
      const now = new Date();
      if (data.id && magicLinks.has(data.id)) {
        const updated = { ...magicLinks.get(data.id)!, ...data };
        magicLinks.set(updated.id, updated);
        magicLinksByNonce.set(updated.nonce, updated);
        return updated;
      }
      const link: StoreMagicLink = {
        id: magicLinkIdSeq++,
        userId: data.userId,
        nonce: data.nonce,
        used: data.used ?? false,
        expiresAt: data.expiresAt,
        createdAt: data.createdAt ?? now,
      };
      magicLinks.set(link.id, link);
      magicLinksByNonce.set(link.nonce, link);
      return link;
    },
  },

  cache: {
    get(key: string): unknown | null {
      const entry = cacheStore.get(key);
      if (!entry) return null;
      if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
        cacheStore.delete(key);
        return null;
      }
      return entry.value;
    },

    set(key: string, value: unknown, ttlSeconds?: number): void {
      cacheStore.set(key, {
        value,
        expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
      });
    },

    del(key: string): void {
      cacheStore.delete(key);
    },
  },
};
