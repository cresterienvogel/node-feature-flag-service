import * as crypto from 'crypto';

export function stableHashInt(input: string): number {
  const hash = crypto.createHash('sha256').update(input).digest('hex');
  const slice = hash.slice(0, 16);
  const num = BigInt('0x' + slice);
  return Number(num % BigInt(Number.MAX_SAFE_INTEGER));
}

export function bucket(input: string, modulo: number): number {
  if (modulo <= 0) return 0;
  const value = stableHashInt(input);
  return value % modulo;
}
