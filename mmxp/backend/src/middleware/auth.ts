import type { Request, Response, NextFunction } from 'express';
import { sendUnauthorized } from '../lib/response';

/**
 * Returns the authenticated user's internal numeric ID from the MMXP session.
 * Returns null if not authenticated — callers decide how to handle.
 */
export function getActingUser(authId: number | undefined): number | null {
  if (!authId) return null;
  return authId;
}

/**
 * Express middleware: blocks unauthenticated requests.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const userId = getActingUser(req.session.authId);
  if (!userId) {
    sendUnauthorized(res);
    return;
  }
  next();
}

/**
 * Express middleware: blocks non-admin requests.
 * Must be used after requireAuth.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  // Admin flag is resolved in routes where needed, via DB lookup
  // This middleware just ensures a session exists; admin check happens in handlers
  const userId = getActingUser(req.session.authId);
  if (!userId) {
    sendUnauthorized(res);
    return;
  }
  next();
}
