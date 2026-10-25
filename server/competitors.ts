/**
 * Recolecta videos competidores REALES: busca en YouTube, descarta los del propio
 * canal y los que superan el plazo, y completa etiquetas/descripción de cada uno.
 */

import type { RawCompetitor } from './benchmark.ts';
import {
  ageDaysFromDate,
  fetchVideoPageDetails,
  formatAgeEs,
  mapWithConcurrency,
  normalizeName,
  searchYouTubeVideos,
  timeframeToMaxDays,
  verifyVideoExists,
  extractYouTubeId,
  type SearchResultVideo,
  type VideoPageDetails,
} from './youtube.ts';

export interface CollectOptions {
  queries: string[];
  timeframe: string;
  count: number;
  ownChannelName?: string;
  ownChannelId?: string;
  ownVideoId?: string;
}

const MAX_PER_CHANNEL = 2;

export function isOwnChannel(
  channel: string,
  channelId: string,
  own: { name?: string; id?: string }
): boolean {
  if (own.id && channelId && own.id === channelId) return true;
  const ownKey = normalizeName(own.name || '');
  const key = normalizeName(channel);
  if (!ownKey || ownKey.length < 3 || !key) return false;
  return key === ownKey || (ownKey.length >= 5 && (key.includes(ownKey) || ownKey.includes(key)));
}

function toRaw(
  base: { videoId: string; title: string; channel: string; viewsNumeric: number; ageDays: number | null; publishedText: string },
  details: VideoPageDetails | null
): RawCompetitor {
  const exactAge = details?.uploadDate ? ageDaysFromDate(details.uploadDate) : null;
  const ageDays = exactAge ?? base.ageDays;
  return {
    videoId: base.videoId,
    title: details?.title || base.title,
    channel: details?.channelName || base.channel,
    viewsNumeric: details?.viewCountNumeric || base.viewsNumeric,
    ageDays,
    publishedText: base.publishedText || formatAgeEs(ageDays),
    tags: details?.tags || [],
    description: details?.description || '',
    durationSeconds: details?.durationSeconds,
  };
}

export async function collectCompetitors(
  opts: CollectOptions
): Promise<{ raws: RawCompetitor[]; queryUsed: string }> {
  const maxDays = timeframeToMaxDays(opts.timeframe);
  const own = { name: opts.ownChannelName, id: opts.ownChannelId };
  const pool: Array<SearchResultVideo & { query: string }> = [];
  const perChannel = new Map<string, number>();
  const seen = new Set<string>();
  const usedQueries: string[] = [];

  for (const query of opts.queries) {
    const results = await searchYouTubeVideos(query, opts.timeframe);
    let added = 0;
    for (const r of results) {
      if (seen.has(r.videoId)) continue;
      seen.add(r.videoId);
      if (r.videoId === opts.ownVideoId) continue;
      if (isOwnChannel(r.channel, r.channelId, own)) continue;
      if (r.ageDays !== null && r.ageDays > maxDays + 2) continue;
      const channelKey = normalizeName(r.channel);
      if ((perChannel.get(channelKey) || 0) >= MAX_PER_CHANNEL) continue;
      perChannel.set(channelKey, (perChannel.get(channelKey) || 0) + 1);
      pool.push({ ...r, query });
      added++;
    }
    if (added > 0) usedQueries.push(query);
    if (pool.length >= opts.count * 2) break;
  }

  if (pool.length === 0) return { raws: [], queryUsed: opts.queries[0] || '' };

  // Los más vistos primero; se piden unos cuantos de más por si alguno falla o es demasiado antiguo
  const candidates = pool.sort((a, b) => b.viewsNumeric - a.viewsNumeric).slice(0, opts.count + 4);
  const enriched = await mapWithConcurrency(candidates, 5, async (c) => {
    const details = await fetchVideoPageDetails(c.videoId);
    return toRaw(c, details);
  });

  const filtered = enriched.filter((r) => r.ageDays === null || r.ageDays <= maxDays + 2);
  const raws = filtered.sort((a, b) => b.viewsNumeric - a.viewsNumeric).slice(0, opts.count);
  return { raws, queryUsed: usedQueries[0] || opts.queries[0] || '' };
}

/** A partir de enlaces sugeridos por la IA: solo se aceptan videos que existen de verdad. */
export async function competitorsFromUrls(
  urls: string[],
  opts: CollectOptions
): Promise<RawCompetitor[]> {
  const maxDays = timeframeToMaxDays(opts.timeframe);
  const own = { name: opts.ownChannelName, id: opts.ownChannelId };
  const ids = Array.from(new Set(urls.map((u) => extractYouTubeId(u)).filter((id): id is string => !!id))).filter(
    (id) => id !== opts.ownVideoId
  );

  const results = await mapWithConcurrency(ids.slice(0, opts.count + 6), 4, async (id) => {
    const exists = await verifyVideoExists(id);
    if (!exists) return null;
    if (isOwnChannel(exists.channel, '', own)) return null;
    const details = await fetchVideoPageDetails(id);
    return toRaw(
      { videoId: id, title: exists.title, channel: exists.channel, viewsNumeric: 0, ageDays: null, publishedText: '' },
      details
    );
  });

  return results
    .filter((r): r is RawCompetitor => !!r)
    .filter((r) => r.ageDays !== null && r.ageDays <= maxDays + 2)
    .sort((a, b) => b.viewsNumeric - a.viewsNumeric)
    .slice(0, opts.count);
}
