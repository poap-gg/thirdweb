export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

export interface ApiSuccess<T = unknown> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: {
    code: ErrorCode;
    message: string;
  };
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ─── Domain shapes returned to clients (public-facing) ───────────────────────

export interface PublicUser {
  id: string; // hashid
  name: string;
  email: string;
  points: number;
  rank: number;
  createdAt: string;
}

export interface PublicEventHistory {
  eventId: string; // hashid
  eventName: string;
  eventDate: string;
  pointsAwarded: number;
  checkedIn: boolean;
}

export interface PublicProfile {
  id: string;
  name: string;
  points: number;
  rank: number;
  events: PublicEventHistory[];
}

export interface LeaderboardEntry {
  rank: number;
  id: string; // hashid
  name: string;
  points: number;
}

export interface PublicEvent {
  id: string; // hashid
  name: string;
  date: string;
  attendeeCount: number;
  createdAt: string;
}

export interface UploadResult {
  eventId: string;
  eventName: string;
  totalRows: number;
  checkedIn: number;
  newUsers: number;
  returningUsers: number;
}

export interface CachedUserData {
  user: PublicUser;
  events: PublicEventHistory[];
}

export interface MagicLinkPayload {
  userId: number;
  email: string;
  nonce: string;
  iat?: number;
  exp?: number;
}

export interface SessionData {
  authId?: number;
  [key: string]: unknown;
}
