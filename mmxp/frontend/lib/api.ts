const API_BASE = '/api';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  const json = await res.json();
  if (!json.ok) {
    throw new ApiError(json.error?.code ?? 'UNKNOWN', json.error?.message ?? 'Request failed', res.status);
  }
  return json.data as T;
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = {
  // Auth
  requestMagicLink: (email: string) =>
    apiFetch<{ sent: boolean; verifyUrl?: string }>('/auth/magic-link/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyToken: (token: string) =>
    apiFetch<{ authenticated: boolean }>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  logout: () =>
    apiFetch<{ loggedOut: boolean }>('/auth/logout', { method: 'POST' }),

  // Users
  getMe: () =>
    apiFetch<{ user: UserProfile; events: EventHistory[] }>('/users/me'),

  getProfile: (id: string) =>
    apiFetch<PublicProfile>(`/users/profile/${id}`),

  // Leaderboard
  getLeaderboard: (page = 1) =>
    apiFetch<{ entries: LeaderboardEntry[]; page: number; pageSize: number }>(
      `/leaderboard?page=${page}`
    ),
};

// Type stubs matching backend shared-types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  points: number;
  rank: number;
  createdAt: string;
}

export interface EventHistory {
  eventId: string;
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
  events: EventHistory[];
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  points: number;
}
