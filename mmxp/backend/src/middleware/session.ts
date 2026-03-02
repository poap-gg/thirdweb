import session from 'express-session';
import { env } from '../config/env';
import type { SessionData } from '../shared-types';

declare module 'express-session' {
  interface SessionData {
    authId?: number;
  }
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const sessionMiddleware = session({
  name: 'mmxp_session', // Completely separate from Revv's 'pid' cookie
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: !env.isDev,
    sameSite: env.isDev ? 'lax' : 'strict',
    maxAge: SEVEN_DAYS_MS,
  },
});
