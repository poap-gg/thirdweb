import Hashids from 'hashids';
import { env } from '../config/env';

let _hashids: Hashids | null = null;

function getHashids(): Hashids {
  if (!_hashids) {
    _hashids = new Hashids(env.HASHID_SALT, 8);
  }
  return _hashids;
}

export function encodeId(id: number): string {
  return getHashids().encode(id);
}

export function decodeId(hash: string): number | null {
  const decoded = getHashids().decode(hash);
  if (!decoded.length) return null;
  const val = decoded[0];
  return typeof val === 'number' ? val : Number(val);
}
