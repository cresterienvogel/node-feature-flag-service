import * as crypto from 'crypto';

export function makeEtag(value: string): string {
  const hash = crypto.createHash('sha1').update(value).digest('hex');
  return `W/"${hash}"`;
}

export function etagMatches(currentEtag: string, ifMatch?: string | string[]): boolean {
  if (!ifMatch) return false;
  if (Array.isArray(ifMatch)) return ifMatch.includes(currentEtag);
  return ifMatch === currentEtag;
}
