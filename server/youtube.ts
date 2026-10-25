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

// Cookies alternativas de consentimiento (YouTube en Europa muestra una pantalla de cookies
// y, sin ellas, devuelve una página sin datos).
const COOKIE_VARIANTS: string[] = [
  'SOCS=CAI; CONSENT=PENDING+987',
  'SOCS=CAESEwgDEgk0ODE3Nzk3MjQaAmVuIAEaBgiA_LyaBg; CONSENT=YES+cb.20210328-17-p0.es+FX+000',
  'CONSENT=YES+1',
];

/** Último motivo por el que falló la lectura de YouTube (se muestra al usuario para poder diagnosticar). */
let lastFetchProblem = '';
export function getLastFetchProblem(): string {
  return lastFetchProblem;
}

async function fetchText(url: string, cookie?: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: cookie ? { ...BASE_HEADERS, Cookie: cookie } : BASE_HEADERS,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      lastFetchProblem = `YouTube respondió con el código ${res.status}`;
      return null;
    }
    if (/consent\.youtube\.com/.test(res.url)) {
      lastFetchProblem = 'YouTube mostró la pantalla de consentimiento de cookies';
      return null;
    }
    return await res.text();
  } catch (e: any) {
    lastFetchProblem = `No hubo conexión con YouTube (${e?.cause?.code || e?.name || 'error de red'})`;
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

// ---------------------------------------------------------------------------
// YouTube Data API v3 (oficial, opcional): se usa si hay YOUTUBE_API_KEY en el .env.
// Es la vía más fiable: no depende de leer páginas web de YouTube.
// ---------------------------------------------------------------------------

const API_CATEGORIES: Record<string, string> = {
  '1': 'Film & Animation', '2': 'Autos & Vehicles', '10': 'Music', '15': 'Pets & Animals',
  '17': 'Sports', '19': 'Travel & Events', '20': 'Gaming', '22': 'People & Blogs',
  '23': 'Comedy', '24': 'Entertainment', '25': 'News & Politics', '26': 'Howto & Style',
  '27': 'Education', '28': 'Science & Technology',
};

function getApiKey(): string {
  return (process.env.YOUTUBE_API_KEY || '').trim();
}

export function hasYouTubeApiKey(): boolean {
  return !!getApiKey();
}

function isoDurationToSeconds(iso: string): number {
  const m = (iso || '').match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return 0;
  return (parseInt(m[1] || '0', 10) * 3600) + (parseInt(m[2] || '0', 10) * 60) + parseInt(m[3] || '0', 10);
}

async function callDataApi(path: string, params: Record<string, string>): Promise<any | null> {
  const key = getApiKey();
  if (!key) return null;
  const qs = new URLSearchParams({ ...params, key }).toString();
  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/${path}?${qs}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      const reason = json?.error?.errors?.[0]?.reason || json?.error?.status || res.status;
      const msg = json?.error?.message ? String(json.error.message).slice(0, 160) : '';
      lastFetchProblem = `La API oficial de YouTube respondió con error (${reason}${msg ? ': ' + msg : ''})`;
      return null;
    }
    return json;
  } catch (e: any) {
    lastFetchProblem = `No hubo conexión con la API oficial de YouTube (${e?.cause?.code || e?.name || 'error de red'})`;
    return null;
  }
}

function detailsFromApiItem(item: any): VideoPageDetails {
  const sn = item?.snippet || {};
  return {
    title: sn.title || '',
    description: sn.description || '',
    tags: Array.isArray(sn.tags) ? sn.tags.map((t: any) => String(t).trim()).filter(Boolean) : [],
    channelName: sn.channelTitle || '',
    channelId: sn.channelId || '',
    category: API_CATEGORIES[String(sn.categoryId)] || '',
    durationSeconds: isoDurationToSeconds(item?.contentDetails?.duration || ''),
    viewCountNumeric: parseInt(item?.statistics?.viewCount || '0', 10) || 0,
    uploadDate: typeof sn.publishedAt === 'string' ? sn.publishedAt.split('T')[0] : '',
    isLive: sn.liveBroadcastContent === 'live',
  };
}

async function fetchDetailsViaDataApi(videoId: string): Promise<VideoPageDetails | null> {
  const json = await callDataApi('videos', { part: 'snippet,statistics,contentDetails', id: videoId });
  const item = json?.items?.[0];
  return item ? detailsFromApiItem(item) : null;
}

async function searchViaDataApi(query: string, maxDays: number): Promise<SearchResultVideo[]> {
  const publishedAfter = new Date(Date.now() - maxDays * 86400000).toISOString();
  const found = await callDataApi('search', {
    part: 'snippet',
    type: 'video',
    order: 'viewCount',
    maxResults: '25',
    q: query,
    publishedAfter,
    relevanceLanguage: 'es',
  });
  const ids: string[] = (found?.items || []).map((i: any) => i?.id?.videoId).filter(Boolean);
  if (ids.length === 0) return [];

  const stats = await callDataApi('videos', { part: 'snippet,statistics,contentDetails', id: ids.join(',') });
  const out: SearchResultVideo[] = [];
  for (const item of stats?.items || []) {
    const d = detailsFromApiItem(item);
    const age = ageDaysFromDate(item?.snippet?.publishedAt || '');
    out.push({
      videoId: item.id,
      title: d.title,
      channel: d.channelName,
      channelId: d.channelId,
      viewsNumeric: d.viewCountNumeric,
      publishedText: formatAgeEs(age),
      ageDays: age,
      durationText: '',
    });
  }
  return out;
}

/** Datos de la página de un video (etiquetas, descripción completa, categoría...). */
export async function fetchVideoPageDetails(videoId: string): Promise<VideoPageDetails | null> {
  if (hasYouTubeApiKey()) {
    const viaApi = await fetchDetailsViaDataApi(videoId);
    if (viaApi) return viaApi;
  }
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

function collectLockups(node: any, out: any[]): void {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) collectLockups(item, out);
    return;
  }
  if (node.lockupViewModel?.contentId) out.push(node.lockupViewModel);
  for (const key of Object.keys(node)) {
    if (key === 'lockupViewModel') continue;
    collectLockups(node[key], out);
  }
}

function findBrowseId(node: any, depth = 0): string {
  if (!node || typeof node !== 'object' || depth > 12) return '';
  if (typeof node.browseId === 'string' && node.browseId.startsWith('UC')) return node.browseId;
  for (const key of Object.keys(node)) {
    const found = findBrowseId(node[key], depth + 1);
    if (found) return found;
  }
  return '';
}

function findBadgeTexts(node: any, out: string[], depth = 0): void {
  if (!node || typeof node !== 'object' || depth > 12) return;
  if (Array.isArray(node)) {
    for (const item of node) findBadgeTexts(item, out, depth + 1);
    return;
  }
  if (typeof node.text === 'string') out.push(node.text);
  for (const key of Object.keys(node)) findBadgeTexts(node[key], out, depth + 1);
}

/** Formato nuevo de YouTube: cada resultado es un "lockupViewModel". */
function parseLockup(l: any): SearchResultVideo | null {
  if (l.contentType && !/VIDEO/i.test(String(l.contentType))) return null;
  if (/PLAYLIST|CHANNEL|MIX/i.test(String(l.contentType || ''))) return null;
  const meta = l.metadata?.lockupMetadataViewModel;
  if (!meta) return null;

  const title: string = meta.title?.content || '';
  const rows: any[] = meta.metadata?.contentMetadataViewModel?.metadataRows || [];
  const parts: string[] = [];
  const rowParts: string[][] = rows.map((r: any) =>
    (r?.metadataParts || []).map((p: any) => String(p?.text?.content || '')).filter(Boolean)
  );
  for (const rp of rowParts) parts.push(...rp);

  const viewsText = parts.find((t) => /visualiz|view|reproduc/i.test(t)) || '';
  const publishedText = parts.find((t) => /hace\s+\d|\d+\s+\w+\s+ago/i.test(t)) || '';
  const channel = (rowParts.find((rp) => rp.length > 0 && rp[0] !== viewsText && rp[0] !== publishedText) || [])[0] || '';

  const badges: string[] = [];
  findBadgeTexts(l.contentImage, badges);
  const durationText = badges.find((t) => /^\d{1,2}:\d{2}(:\d{2})?$/.test(t.trim())) || '';

  return {
    videoId: l.contentId,
    title,
    channel,
    channelId: findBrowseId(meta.image),
    viewsNumeric: parseViewCount(viewsText),
    publishedText,
    ageDays: parseAgeDays(publishedText),
    durationText,
  };
}

/** Convierte el JSON de la página de resultados en una lista de videos (formato antiguo y nuevo). */
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

  const lockups: any[] = [];
  collectLockups(initialData, lockups);
  for (const l of lockups) {
    if (!l.contentId || seen.has(l.contentId)) continue;
    const parsed = parseLockup(l);
    if (!parsed) continue;
    seen.add(l.contentId);
    results.push(parsed);
  }
  return results;
}

/** Resumen de lo que había en la respuesta, para poder diagnosticar cuando no se encuentra nada. */
function describeSearchData(data: any): string {
  let raw = '';
  try {
    raw = JSON.stringify(data) || '';
  } catch {
    return 'respuesta ilegible';
  }
  const count = (needle: string) => raw.split(needle).length - 1;
  const bits: string[] = [];
  if (data && typeof data === 'object') bits.push(`claves: ${Object.keys(data).slice(0, 6).join('/')}`);
  if (data?.error?.message) bits.push(`error: ${String(data.error.message).slice(0, 100)}`);
  bits.push(...[
    `videoRenderer×${count('"videoRenderer"')}`,
    `lockupViewModel×${count('"lockupViewModel"')}`,
    `reelItem×${count('"reelItemRenderer"')}`,
  ]);
  if (/"messageRenderer"|did not match any|no coincide/i.test(raw)) bits.push('YouTube indica que no hay coincidencias');
  return bits.join(', ');
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

const INNERTUBE_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';

/** Vía alternativa: la misma API interna que usa la web de YouTube (no necesita cookies). */
async function searchViaInnerTube(query: string, params: string): Promise<SearchResultVideo[]> {
  try {
    const res = await fetch(`https://www.youtube.com/youtubei/v1/search?prettyPrint=false&key=${INNERTUBE_KEY}`, {
      method: 'POST',
      headers: {
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/json',
        Origin: 'https://www.youtube.com',
        'X-YouTube-Client-Name': '1',
        'X-YouTube-Client-Version': '2.20250101.00.00',
        'Accept-Language': 'es,en;q=0.9',
      },
      body: JSON.stringify({
        context: { client: { clientName: 'WEB', clientVersion: '2.20250101.00.00', hl: 'es', gl: 'ES' } },
        query,
        params,
      }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      lastFetchProblem = `La API interna de YouTube respondió con el código ${res.status}`;
      return [];
    }
    const json = await res.json();
    const parsed = parseSearchResults(json);
    if (parsed.length === 0) {
      lastFetchProblem = `La API interna de YouTube no devolvió videos reconocibles (${describeSearchData(json)})`;
    }
    return parsed;
  } catch (e: any) {
    lastFetchProblem = `No hubo conexión con YouTube (${e?.cause?.code || e?.name || 'error de red'})`;
    return [];
  }
}

export async function searchYouTubeVideos(query: string, timeframe: Timeframe): Promise<SearchResultVideo[]> {
  const maxDays = timeframeToMaxDays(timeframe);

  // Vía 0: API oficial (si hay YOUTUBE_API_KEY)
  let apiProblem = '';
  if (hasYouTubeApiKey()) {
    const official = await searchViaDataApi(query, maxDays);
    if (official.length > 0) return official;
    apiProblem = lastFetchProblem || 'La API oficial de YouTube no devolvió videos para esta búsqueda';
  } else {
    lastFetchProblem = 'No hay YOUTUBE_API_KEY configurada (la lectura sin clave suele ser bloqueada por YouTube)';
  }

  const sp = maxDays > 31 ? SP_THIS_YEAR : SP_THIS_MONTH;
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=${sp}&hl=es&gl=ES`;

  // Vía 1: página de resultados, probando varias cookies de consentimiento
  for (const cookie of COOKIE_VARIANTS) {
    const html = await fetchText(url, cookie);
    if (!html) continue;
    const data = extractJsonAfter(html, ['var ytInitialData = ', 'window["ytInitialData"] = ', 'ytInitialData = ']);
    const results = data ? parseSearchResults(data) : [];
    if (results.length > 0) return results;
    lastFetchProblem = data
      ? `La página de YouTube llegó sin videos reconocibles (${describeSearchData(data)})`
      : 'La página de YouTube llegó sin datos de resultados (posible bloqueo o consentimiento)';
  }

  // Vía 2: API interna de YouTube
  const viaApi = await searchViaInnerTube(query, decodeURIComponent(sp));
  if (viaApi.length > 0) return viaApi;

  // Vía 3: sin filtro de fecha (el filtro se aplica después por la fecha de cada video)
  const unfiltered = await searchViaInnerTube(query, 'EgIQAQ==');
  if (unfiltered.length === 0 && apiProblem) lastFetchProblem = apiProblem;
  return unfiltered;
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
