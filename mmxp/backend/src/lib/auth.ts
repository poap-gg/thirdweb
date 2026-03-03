import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { AppDataSource } from '../config/database';
import { MagicLink } from '../entities/MagicLink';
import type { MagicLinkPayload } from '../shared-types';

const MAGIC_LINK_EXPIRY_HOURS = 24;
const MAGIC_LINK_EXPIRY_MS = MAGIC_LINK_EXPIRY_HOURS * 60 * 60 * 1000;

export function generateNonce(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function signMagicLinkToken(payload: Omit<MagicLinkPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, env.SESSION_SECRET, {
    expiresIn: `${MAGIC_LINK_EXPIRY_HOURS}h`,
  });
}

export function verifyMagicLinkToken(token: string): MagicLinkPayload | null {
  try {
    return jwt.verify(token, env.SESSION_SECRET) as MagicLinkPayload;
  } catch {
    return null;
  }
}

export async function createMagicLink(userId: number, email: string): Promise<string> {
  const nonce = generateNonce();
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MS);

  const repo = AppDataSource.getRepository(MagicLink);
  const link = repo.create({ userId, nonce, expiresAt, used: false });
  await repo.save(link);

  const token = signMagicLinkToken({ userId, email, nonce });
  const url = `${env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${encodeURIComponent(token)}`;
  return url;
}

export async function consumeMagicLink(
  token: string
): Promise<{ userId: number; email: string } | null> {
  const payload = verifyMagicLinkToken(token);
  if (!payload) return null;

  const repo = AppDataSource.getRepository(MagicLink);
  const link = await repo.findOne({ where: { nonce: payload.nonce, used: false } });
  if (!link) return null;
  if (link.expiresAt < new Date()) return null;

  link.used = true;
  await repo.save(link);

  return { userId: payload.userId, email: payload.email };
}
