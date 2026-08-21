import { createHash } from 'node:crypto';

export function buildDedupeKey(attributes: Record<string, string>): string {
  const sorted: Record<string, string> = {};
  for (const key of Object.keys(attributes).sort()) {
    sorted[key] = attributes[key];
  }
  return createHash('sha256').update(JSON.stringify(sorted)).digest('hex');
}
