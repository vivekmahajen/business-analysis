import crypto from 'crypto';
import { prisma } from '../lib/prisma';

function hashUrl(url: string): string {
  return crypto.createHash('md5').update(url.toLowerCase().trim()).digest('hex');
}

export async function upsertScore(url: string, overallScore: number): Promise<void> {
  const urlHash = hashUrl(url);
  await prisma.urlScoreCache.upsert({
    where: { urlHash },
    update: { overallScore, url },
    create: { urlHash, url, overallScore },
  });
}

// Returns a map of urlHash → overallScore for any of the given URLs that are cached
export async function getCachedScores(urls: string[]): Promise<Map<string, number>> {
  const hashes = urls.map(u => hashUrl(u));
  const cached = await prisma.urlScoreCache.findMany({
    where: { urlHash: { in: hashes } },
    select: { urlHash: true, overallScore: true },
  });
  const map = new Map<string, number>();
  for (const entry of cached) {
    map.set(entry.urlHash, entry.overallScore);
  }
  return map;
}

export { hashUrl as hashUrlForCache };
