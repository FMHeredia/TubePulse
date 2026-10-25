/**
 * Detección del tipo de video del usuario (música / general) y de sus rasgos:
 * género, formato (videoclip, lyric video, directo...), artista y canción.
 *
 * Esto es lo que evita que un video musical reciba sugerencias de otro tipo.
 */

import type { ContentProfile, ContentTypeOverride } from '../src/types/index.ts';

export interface ProfileInput {
  title: string;
  description?: string;
  tags?: string[];
  channelName?: string;
  category?: string;
}

interface GenreDef {
  label: string;
  keywords: string[];
}

const GENRES: GenreDef[] = [
  { label: 'Reggaetón', keywords: ['reggaeton', 'reggaetón', 'perreo'] },
  { label: 'Trap', keywords: ['trap', 'trap latino', 'trap español'] },
  { label: 'Hip Hop / Rap', keywords: ['hip hop', 'hiphop', 'hip-hop', 'rap', 'drill', 'boom bap'] },
  { label: 'K-Pop', keywords: ['k-pop', 'kpop'] },
  { label: 'Pop', keywords: ['pop', 'pop latino', 'synthpop', 'electropop'] },
  { label: 'Rock', keywords: ['rock', 'indie rock', 'rock alternativo', 'punk', 'punk rock', 'grunge'] },
  { label: 'Metal', keywords: ['metal', 'heavy metal', 'death metal', 'metalcore', 'thrash'] },
  { label: 'Techno', keywords: ['techno', 'tecno', 'melodic techno', 'hard techno'] },
  { label: 'House', keywords: ['house', 'deep house', 'tech house', 'progressive house'] },
  { label: 'Electrónica / EDM', keywords: ['edm', 'electronic', 'electrónica', 'electronica', 'dubstep', 'trance', 'drum and bass', 'dnb', 'future bass'] },
  { label: 'Flamenco', keywords: ['flamenco', 'rumba', 'rumba flamenca'] },
  { label: 'Salsa', keywords: ['salsa'] },
  { label: 'Bachata', keywords: ['bachata'] },
  { label: 'Cumbia', keywords: ['cumbia'] },
  { label: 'Merengue', keywords: ['merengue'] },
  { label: 'Regional Mexicano', keywords: ['corridos', 'corridos tumbados', 'regional mexicano', 'banda', 'norteño', 'mariachi', 'ranchera'] },
  { label: 'Lo-Fi', keywords: ['lofi', 'lo-fi', 'lo fi'] },
  { label: 'Jazz', keywords: ['jazz'] },
  { label: 'Blues', keywords: ['blues'] },
  { label: 'Música Clásica', keywords: ['classical', 'música clásica', 'musica clasica', 'orquesta', 'piano clásico'] },
  { label: 'Ambient', keywords: ['ambient', 'chillout', 'chill out', 'downtempo'] },
  { label: 'R&B / Soul', keywords: ['r&b', 'rnb', 'soul', 'neo soul'] },
  { label: 'Country', keywords: ['country'] },
  { label: 'Reggae', keywords: ['reggae', 'dancehall', 'ska'] },
  { label: 'Funk', keywords: ['funk', 'disco'] },
  { label: 'Folk', keywords: ['folk', 'folklore', 'acústico', 'acoustic guitar'] },
  { label: 'Indie', keywords: ['indie', 'indie pop', 'indie folk'] },
  { label: 'Música Cristiana', keywords: ['gospel', 'cristiana', 'worship', 'alabanza'] },
  { label: 'Balada', keywords: ['balada', 'ballad', 'romántica', 'romantica'] },
];

interface FormatDef {
  id: string;
  canonical: string;
  regex: RegExp;
}

const FORMATS: FormatDef[] = [
  { id: 'lyric', canonical: 'Lyric Video', regex: /lyric(s)?\s*video|video\s+(con\s+)?letra|con\s+letra|\blyrics?\b|\bletra\b/i },
  { id: 'audio', canonical: 'Official Audio', regex: /official\s+audio|audio\s+oficial|\(audio\)|\[audio\]/i },
  { id: 'visualizer', canonical: 'Visualizer', regex: /visuali[sz]er/i },
  { id: 'official', canonical: 'Official Video', regex: /official\s+(music\s+)?video|video\s+oficial|videoclip(\s+oficial)?|official\s+mv|music\s+video|\bm\/v\b/i },
  { id: 'live', canonical: 'Live', regex: /\blive\b|en\s+vivo|\bdirecto\b|concierto|live\s+session|live\s+performance/i },
  { id: 'djset', canonical: 'DJ Set', regex: /dj\s*set|\bset\b|\bmix\b|sesi[oó]n|\bsession\b/i },
  { id: 'remix', canonical: 'Remix', regex: /\bremix\b|\bedit\b|\bbootleg\b/i },
  { id: 'cover', canonical: 'Cover', regex: /\bcover\b|\bversi[oó]n\b/i },
  { id: 'acoustic', canonical: 'Acoustic', regex: /acoustic|ac[uú]stic[oa]/i },
  { id: 'instrumental', canonical: 'Instrumental', regex: /instrumental|\bbeat\b|type\s+beat/i },
  { id: 'slowed', canonical: 'Slowed + Reverb', regex: /slowed|reverb|sped\s*up/i },
];

const MUSIC_KEYWORDS: RegExp[] = [
  /official\s+(music\s+)?video|video\s+oficial|videoclip|music\s+video/i,
  /lyric(s)?\s*video|\blyrics?\b|\bletra\b/i,
  /official\s+audio|audio\s+oficial/i,
  /\bremix\b|\bfeat\.?\b|\bft\.?\b|\bprod\.?\b/i,
  /\b[aá]lbum\b|\bsingle\b|\bep\b|\bmixtape\b/i,
  /dj\s*set|visuali[sz]er|\bacoustic\b|\binstrumental\b|\bcover\b/i,
  /en\s+vivo|\blive\s+(session|performance)\b|concierto/i,
];

const MUSIC_DESCRIPTION_SIGNALS =
  /spotify|apple\s*music|soundcloud|deezer|bandcamp|amazon\s*music|tidal|℗|compositor|producid[oa]\s+por|produced\s+by|listen\s+(on|to)|escucha\s+(en|el|la)/i;

const MUSIC_CHANNEL_HINT = /vevo|records?|music|m[uú]sica|topic|sounds?|beats|label|entertainment/i;

const NON_MUSIC_TITLE = /tutorial|c[oó]mo\s+(hacer|se|crear|usar)|how\s+to|review|rese[nñ]a|gameplay|unboxing|vlog|receta|gu[ií]a\s+(para|de)/i;

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasWord(haystack: string, keyword: string): boolean {
  const re = new RegExp(`(^|[^a-z0-9áéíóúñ])${escapeRegex(keyword)}([^a-z0-9áéíóúñ]|$)`, 'i');
  return re.test(haystack);
}

export function detectGenre(input: ProfileInput): string | undefined {
  const title = (input.title || '').toLowerCase();
  const tags = (input.tags || []).map((t) => t.toLowerCase());
  const desc = (input.description || '').toLowerCase().slice(0, 1500);

  let best: { label: string; score: number } | null = null;
  for (const g of GENRES) {
    let score = 0;
    for (const kw of g.keywords) {
      if (hasWord(title, kw)) score += 3;
      if (tags.some((t) => hasWord(t, kw))) score += 2;
      if (hasWord(desc, kw)) score += 1;
    }
    if (score > 0 && (!best || score > best.score)) best = { label: g.label, score };
  }
  return best?.label;
}

export function detectFormat(input: ProfileInput): { id: string; label: string } | undefined {
  const title = input.title || '';
  const tagsText = (input.tags || []).join(' | ');

  // 1) lo que el propio título dice (se respeta el idioma y la forma de escribirlo)
  for (const f of FORMATS) {
    const m = title.match(f.regex);
    if (m) {
      const bracket = title.match(new RegExp(`[\\(\\[]([^\\)\\]]*(?:${f.regex.source})[^\\)\\]]*)[\\)\\]]`, 'i'));
      return { id: f.id, label: (bracket?.[1] || m[0]).trim() };
    }
  }
  // 2) etiquetas
  for (const f of FORMATS) {
    if (f.regex.test(tagsText)) return { id: f.id, label: f.canonical };
  }
  return undefined;
}

export interface ParsedMusicTitle {
  artist?: string;
  song: string;
  feat?: string;
  extras: string[];
}

/** "Artista - Canción (feat. X) (Official Video) | Algo" -> artista, canción, feat. */
export function parseMusicTitle(title: string, channelName?: string): ParsedMusicTitle {
  let t = (title || '').replace(/\s+/g, ' ').trim();

  const brackets = Array.from(t.matchAll(/[\(\[\{]([^\)\]\}]*)[\)\]\}]/g)).map((m) => m[1].trim());
  const feat = brackets.find((b) => /^(feat|ft|featuring|con)\b\.?/i.test(b));
  t = t.replace(/[\(\[\{][^\)\]\}]*[\)\]\}]/g, ' ').replace(/\s+/g, ' ').trim();

  const pipeParts = t.split(/\s+\|\s+/);
  const head = pipeParts[0];
  const extras = [...pipeParts.slice(1), ...brackets.filter((b) => b && b !== feat)];

  const dashParts = head.split(/\s+[-–—]\s+/);
  let artist: string | undefined;
  let song: string;
  if (dashParts.length >= 2) {
    artist = dashParts[0].trim();
    song = dashParts.slice(1).join(' - ').trim();
  } else {
    song = head.trim();
    const channel = (channelName || '').replace(/\s*[-–]?\s*(topic|vevo|official|oficial|records?)\s*$/i, '').trim();
    if (channel && channel.toLowerCase() !== 'canal de youtube') artist = channel;
  }

  // "feat." dentro del texto sin paréntesis
  let featText = feat;
  const inline = song.match(/\s+(feat\.?|ft\.?|featuring)\s+(.+)$/i);
  if (inline) {
    featText = featText || `${inline[1]} ${inline[2]}`;
    song = song.slice(0, inline.index).trim();
  }

  return { artist, song: song || title.trim(), feat: featText, extras };
}

function detectLanguage(text: string): 'es' | 'en' {
  const sample = text.slice(0, 800).toLowerCase();
  const es = (sample.match(/\b(el|la|los|las|de|del|que|y|en|con|para|por|una|un|tu|mi|suscr[ií]bete|escucha|canci[oó]n|nuevo|nueva|vivo)\b/g) || []).length;
  const en = (sample.match(/\b(the|and|of|to|in|with|for|your|my|subscribe|listen|new|song|official)\b/g) || []).length;
  return en > es ? 'en' : 'es';
}

export function detectContentProfile(
  input: ProfileInput,
  override: ContentTypeOverride = 'auto'
): ContentProfile {
  const title = input.title || '';
  const description = input.description || '';
  const tags = input.tags || [];
  const category = (input.category || '').trim();

  const language = detectLanguage(`${title} ${description}`);
  const genre = detectGenre(input);
  const format = detectFormat(input);
  const signals: string[] = [];
  let score = 0;

  const isMusicCategory = /^(music|música|musica)$/i.test(category);
  if (isMusicCategory) {
    score += 5;
    signals.push(`Categoría de YouTube: ${category}`);
  } else if (category) {
    signals.push(`Categoría de YouTube: ${category}`);
  }

  if (genre) {
    score += 2;
    signals.push(`Género detectado: ${genre}`);
  }
  if (format) {
    score += 2;
    signals.push(`Formato detectado: ${format.label}`);
  }

  const searchable = `${title} ${tags.join(' ')}`;
  const keywordHits = MUSIC_KEYWORDS.filter((re) => re.test(searchable)).length;
  if (keywordHits > 0) {
    score += Math.min(keywordHits, 3);
    signals.push('Palabras típicas de música en título o etiquetas');
  }

  if (MUSIC_DESCRIPTION_SIGNALS.test(description)) {
    score += 1;
    signals.push('La descripción menciona plataformas o créditos musicales');
  }
  if (input.channelName && MUSIC_CHANNEL_HINT.test(input.channelName)) {
    score += 1;
    signals.push('El nombre del canal sugiere contenido musical');
  }
  if (/\s[-–—]\s/.test(title) && !NON_MUSIC_TITLE.test(title)) {
    score += 1;
    signals.push('Título con formato «Artista - Canción»');
  }
  if (NON_MUSIC_TITLE.test(title)) {
    score -= 3;
    signals.push('El título parece de tutorial/reseña/gameplay');
  }

  let kind: 'music' | 'general' = score >= 3 ? 'music' : 'general';
  let manual = false;
  if (override === 'music') {
    kind = 'music';
    manual = true;
    signals.unshift('Tipo elegido manualmente: Música');
  } else if (override === 'general') {
    kind = 'general';
    manual = true;
    signals.unshift('Tipo elegido manualmente: Contenido general');
  }

  let confidence: ContentProfile['confidence'];
  if (manual) confidence = 'alta';
  else if (kind === 'music') confidence = score >= 6 ? 'alta' : score >= 4 ? 'media' : 'baja';
  else confidence = category && !isMusicCategory ? 'alta' : score <= 0 ? 'media' : 'baja';

  const profile: ContentProfile = {
    kind,
    kindLabel: kind === 'music' ? 'Música' : 'Contenido general',
    language,
    confidence,
    signals,
    manual: manual || undefined,
  };

  if (kind === 'music') {
    const parsed = parseMusicTitle(title, input.channelName);
    profile.genre = genre;
    profile.format = format?.label;
    profile.artist = parsed.artist;
    profile.song = parsed.song;
  }
  return profile;
}
