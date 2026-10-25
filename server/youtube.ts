/**
 * Lectura de datos públicos de YouTube (sin API key):
 *  - metadatos de un video (título, descripción, etiquetas, categoría...)
 *  - búsqueda de videos recientes y populares para la comparativa
 *
 * Todo lo que se devuelve sale de YouTube; no se inventa ningún dato.
 */

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// SOCS=CAI evita la pantalla de consentimiento de cookies que YouTube muestra en Europa
// (sin esto, la página llega vacía de datos y la búsqueda no devuelve nada).
const BASE_HEADERS: Record<string, string> = {
  'User-Agent': USER_AGENT,
  'Accept-Language': 'es,en;q=0.9',
  Cookie: 'SOCS=CAI; CONSENT=PENDING+987',
};

const FETCH_TIMEOUT_MS = 12000;

export interface VideoPageDetails {
  title: string;
  description: string;
  tags: string[];
  channelName: string;
  channelId: string;
  category: string;
  durationSeconds: number;
  viewCountNumeric: number;
  uploadDate: string; // YYYY-MM-DD o ''
  isLive: boolean;
}

export interface VideoMetadata {
  videoId: string;
  url: string;
  title: string;
  channelName: string;
  channelId: string;
  thumbnail: string;
  description: string;
  tags: string[];
  uploadDate: string;
  viewCount: string;
  category: string;
  durationSeconds: number;
}

export interface SearchResultVideo {
  videoId: string;
  title: string;
  channel: string;
  channelId: string;
  viewsNumeric: number;
  publishedText: string;
  ageDays: number | null;
  durationText: string;
}

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();
  const match = cleanUrl.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/
  );
  if (match && match[1]) return match[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) return cleanUrl;
  return null;
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: BASE_HEADERS,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/** Extrae el objeto JSON que aparece justo después de un marcador (ej. "ytInitialData = "). */
export function extractJsonAfter(html: string, markers: string[]): any | null {
  for (const marker of markers) {
    const idx = html.indexOf(marker);
    if (idx === -1) continue;
    const start = html.indexOf('{', idx + marker.length);
    if (start === -1) continue;

    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < html.length; i++) {
      const ch = html[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') inString = true;
      else if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(html.slice(start, i + 1));
          } catch {
            break;
          }
        }
      }
    }
  }
  return null;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function textOf(node: any): string {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (typeof node.simpleText === 'string') return node.simpleText;
  if (Array.isArray(node.runs)) return node.runs.map((r: any) => r?.text ?? '').join('');
  return '';
}

/** "1.234.567 visualizaciones", "1,2 M de visualizaciones", "45 mil", "3.4K views" -> número */
export function parseViewCount(text: string): number {
  if (!text) return 0;
  const t = text.toLowerCase().replace(/ /g, ' ').trim();
  const m = t.match(/([\d][\d.,]*)\s*(mil millones|millones|mill\.?|mm|m|mil|k|b)?(?![a-zñ])/);
  if (!m) return 0;
  const raw = m[1];
  const suffix = m[2];
  if (!suffix) {
    const digits = raw.replace(/[.,]/g, '');
    return parseInt(digits, 10) || 0;
  }
  const num = parseFloat(raw.replace(',', '.'));
  if (Number.isNaN(num)) return 0;
  switch (suffix) {
    case 'mil millones':
    case 'mm':
    case 'b':
      return Math.round(num * 1e9);
    case 'millones':
    case 'mill.':
    case 'mill':
    case 'm':
      return Math.round(num * 1e6);
    case 'mil':
    case 'k':
      return Math.round(num * 1e3);
    default:
      return Math.round(num);
  }
}

/** "hace 3 días", "3 weeks ago", "Se emitió hace 2 horas" -> días (puede ser 0.x). null si no se entiende. */
export function parseAgeDays(text: string): number | null {
  if (!text) return null;
  const t = text.toLowerCase();
  const es = t.match(/hace\s+(\d+)\s+(segundo|minuto|hora|d[ií]a|semana|mes|a[nñ]o)/);
  const en = t.match(/(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago/);
  const m = es || en;
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const unit = m[2];
  if (/^(segundo|second)/.test(unit)) return 0;
  if (/^(minuto|minute)/.test(unit)) return 0;
  if (/^(hora|hour)/.test(unit)) return n / 24;
  if (/^(d[ií]a|day)/.test(unit)) return n;
  if (/^(semana|week)/.test(unit)) return n * 7;
  if (/^(mes|month)/.test(unit)) return n * 31; // "hace 1 mes" puede ser entre 30 y 59 días
  if (/^(a[nñ]o|year)/.test(unit)) return n * 365;
  return null;
}

export function ageDaysFromDate(dateStr: string): number | null {
  if (!dateStr) return null;
  const ts = Date.parse(dateStr);
  if (Number.isNaN(ts)) return null;
  return Math.max(0, (Date.now() - ts) / 86400000);
}

export function formatAgeEs(days: number | null, fallback = ''): string {
  if (days === null) return fallback;
  if (days < 1) return 'Hoy';
  if (days < 2) return 'Hace 1 día';
  if (days < 14) return `Hace ${Math.floor(days)} días`;
  if (days < 60) return `Hace ${Math.floor(days / 7)} semanas`;
  return `Hace ${Math.floor(days / 30)} meses`;
}

export function formatViewsEs(n: number): string {
  if (!n) return 'Sin datos';
  return `${n.toLocaleString('es-ES')} vistas`;
}

/** Datos de la página de un video (etiquetas, descripción completa, categoría...). */
export async function fetchVideoPageDetails(videoId: string): Promise<VideoPageDetails | null> {
  const html = await fetchText(`https://www.youtube.com/watch?v=${videoId}&hl=es`);
  if (!html) return null;

  const details: VideoPageDetails = {
    title: '',
    description: '',
    tags: [],
    channelName: '',
    channelId: '',
    category: '',
    durationSeconds: 0,
    viewCountNumeric: 0,
    uploadDate: '',
    isLive: false,
  };

  const player = extractJsonAfter(html, ['var ytInitialPlayerResponse = ', 'ytInitialPlayerResponse = ']);
  const vd = player?.videoDetails;
  const micro = player?.microformat?.playerMicroformatRenderer;

  if (vd) {
    details.title = vd.title || '';
    details.description = vd.shortDescription || '';
    details.tags = Array.isArray(vd.keywords) ? vd.keywords.map((k: any) => String(k).trim()).filter(Boolean) : [];
    details.channelName = vd.author || '';
    details.channelId = vd.channelId || '';
    details.durationSeconds = parseInt(vd.lengthSeconds, 10) || 0;
    details.viewCountNumeric = parseInt(vd.viewCount, 10) || 0;
    details.isLive = !!vd.isLiveContent;
  }
  if (micro) {
    details.category = micro.category || '';
    const date = micro.publishDate || micro.uploadDate || '';
    details.uploadDate = typeof date === 'string' ? date.split('T')[0] : '';
    if (!details.description && micro.description?.simpleText) details.description = micro.description.simpleText;
  }

  // Respaldo con expresiones regulares si no se pudo leer el JSON del reproductor
  if (!details.description) {
    const descMatch =
      html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) ||
      html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i);
    if (descMatch?.[1]) details.description = decodeHtmlEntities(descMatch[1]);
  }
  if (details.tags.length === 0) {
    const kwMatch = html.match(/<meta\s+name="keywords"\s+content="([^"]*)"/i);
    if (kwMatch?.[1]) {
      details.tags = Array.from(
        new Set(
          decodeHtmlEntities(kwMatch[1])
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean)
        )
      );
    }
  }
  if (!details.viewCountNumeric) {
    const viewsMatch = html.match(/"viewCount":\s*"(\d+)"/);
    if (viewsMatch) details.viewCountNumeric = parseInt(viewsMatch[1], 10) || 0;
  }
  if (!details.uploadDate) {
    const dateMatch =
      html.match(/"uploadDate":\s*"([^"]+)"/) || html.match(/<meta\s+itemprop="uploadDate"\s+content="([^"]+)"/);
    if (dateMatch?.[1]) details.uploadDate = dateMatch[1].split('T')[0];
  }
  if (!details.category) {
    const catMatch = html.match(/"category":\s*"([^"]+)"/);
    if (catMatch?.[1]) details.category = catMatch[1];
  }
  if (!details.title) {
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch?.[1]) details.title = decodeHtmlEntities(titleMatch[1]).replace(/ - YouTube$/, '').trim();
  }

  // Si no hay nada útil, probablemente fue la página de consentimiento o un bloqueo
  if (!details.title && !details.description && details.tags.length === 0) return null;
  return details;
}

/** Metadatos completos del video del usuario (oEmbed + página). */
export async function fetchYouTubeVideoMetadata(videoId: string): Promise<VideoMetadata> {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  let title = '';
  let channelName = '';
  let thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  try {
    const oembedRes = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`,
      { headers: BASE_HEADERS, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
    );
    if (oembedRes.ok) {
      const data: any = await oembedRes.json();
      title = data.title || '';
      channelName = data.author_name || '';
      if (data.thumbnail_url) thumbnail = data.thumbnail_url;
    }
  } catch (e) {
    console.warn('oEmbed fetch error:', e);
  }

  const page = await fetchVideoPageDetails(videoId);

  return {
    videoId,
    url: videoUrl,
    title: title || page?.title || `Video ${videoId}`,
    channelName: channelName || page?.channelName || 'Canal de YouTube',
    channelId: page?.channelId || '',
    thumbnail,
    description: page?.description || '',
    tags: page?.tags || [],
    uploadDate: page?.uploadDate || '',
    viewCount: page?.viewCountNumeric ? page.viewCountNumeric.toLocaleString('es-ES') : 'No disponible',
    category: page?.category || '',
    durationSeconds: page?.durationSeconds || 0,
  };
}

/** ¿Existe realmente este video? (oEmbed devuelve 404 si no existe). */
export async function verifyVideoExists(
  videoId: string
): Promise<{ title: string; channel: string } | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`,
      { headers: BASE_HEADERS, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data: any = await res.json();
    return { title: data.title || '', channel: data.author_name || '' };
  } catch {
    return null;
  }
}

function collectVideoRenderers(node: any, out: any[]): void {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) collectVideoRenderers(item, out);
    return;
  }
  if (node.videoRenderer?.videoId) out.push(node.videoRenderer);
  for (const key of Object.keys(node)) {
    if (key === 'videoRenderer') continue;
    collectVideoRenderers(node[key], out);
  }
}

/** Convierte el JSON de la página de resultados en una lista de videos. */
export function parseSearchResults(initialData: any): SearchResultVideo[] {
  const renderers: any[] = [];
  collectVideoRenderers(initialData, renderers);

  const seen = new Set<string>();
  const results: SearchResultVideo[] = [];
  for (const r of renderers) {
    const videoId: string = r.videoId;
    if (!videoId || seen.has(videoId)) continue;
    seen.add(videoId);

    const publishedText = textOf(r.publishedTimeText);
    const viewsText = textOf(r.viewCountText) || textOf(r.shortViewCountText);
    const ownerRun = r.ownerText?.runs?.[0] ?? r.longBylineText?.runs?.[0];

    results.push({
      videoId,
      title: textOf(r.title),
      channel: ownerRun?.text || '',
      channelId: ownerRun?.navigationEndpoint?.browseEndpoint?.browseId || '',
      viewsNumeric: parseViewCount(viewsText),
      publishedText,
      ageDays: parseAgeDays(publishedText),
      durationText: textOf(r.lengthText),
    });
  }
  return results;
}

export type Timeframe = '2_weeks' | '1_month' | '3_months' | string;

export function timeframeToMaxDays(timeframe: Timeframe): number {
  if (timeframe === '2_weeks') return 14;
  if (timeframe === '3_months') return 92;
  return 30;
}

// Filtros de búsqueda de YouTube (parámetro "sp"): ordenar por visualizaciones + tipo "video"
const SP_THIS_MONTH = 'CAMSBAgEEAE%3D';
const SP_THIS_YEAR = 'CAMSBAgFEAE%3D';

export async function searchYouTubeVideos(query: string, timeframe: Timeframe): Promise<SearchResultVideo[]> {
  const maxDays = timeframeToMaxDays(timeframe);
  const sp = maxDays > 31 ? SP_THIS_YEAR : SP_THIS_MONTH;
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=${sp}&hl=es`;
  const html = await fetchText(url);
  if (!html) return [];

  const data = extractJsonAfter(html, ['var ytInitialData = ', 'window["ytInitialData"] = ', 'ytInitialData = ']);
  if (!data) return [];
  return parseSearchResults(data);
}

export function normalizeName(name: string): string {
  return (name || '').toLowerCase().replace(/[^a-z0-9áéíóúüñ]+/g, '');
}

/** Ejecuta tareas en paralelo con un límite de concurrencia. */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await worker(items[i], i);
    }
  });
  await Promise.all(runners);
  return results;
}
