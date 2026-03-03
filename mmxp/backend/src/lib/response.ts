import type { Response } from 'express';
import { ErrorCode } from '../shared-types';
import type { ApiSuccess, ApiError } from '../shared-types';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  const body: ApiSuccess<T> = { ok: true, data };
  res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  code: ErrorCode,
  message: string,
  statusCode = 400
): void {
  const body: ApiError = { ok: false, error: { code, message } };
  res.status(statusCode).json(body);
}

export function sendUnauthorized(res: Response, message = 'Unauthorized'): void {
  sendError(res, ErrorCode.UNAUTHORIZED, message, 401);
}

export function sendNotFound(res: Response, message = 'Not found'): void {
  sendError(res, ErrorCode.NOT_FOUND, message, 404);
}

export function sendValidationError(res: Response, message: string): void {
  sendError(res, ErrorCode.VALIDATION_ERROR, message, 422);
}

export function sendMissingField(res: Response, field: string): void {
  sendError(res, ErrorCode.MISSING_REQUIRED_FIELD, `Missing required field: ${field}`, 422);
}

export function sendInternalError(res: Response, err: unknown): void {
  const message = err instanceof Error ? err.message : 'An unexpected error occurred';
  console.error('[MMXP] Internal error:', err);
  // Hooks for Sentry / Slack can be wired here without refactoring callers:
  // reportToSentry(err);
  // notifySlack(message);
  sendError(res, ErrorCode.INTERNAL_SERVER_ERROR, message, 500);
}
