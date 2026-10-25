/**
 * Construye el benchmark a partir de videos competidores REALES:
 * matriz de etiquetas, patrones, puntuación SEO y sugerencias que mantienen
 * la misma lógica del video del usuario (mismo artista, canción, género y formato).
 */

import type {
  BenchmarkResult,
  CommonPatterns,
  CompetitorVideo,
  ContentProfile,
  OptimizedSuggestions,
  SuggestedTitle,
  TagMatrixItem,
} from '../src/types/index.ts';
import { formatAgeEs, formatViewsEs, normalizeName } from './youtube.ts';

export interface RawCompetitor {
  videoId: string;
  title: string;
  channel: string;
  viewsNumeric: number;
  ageDays: number | null;
  publishedText: string;
  tags: string[];
  description: string;
  durationSeconds?: number;
}

export interface UserVideoInput {
  title: string;
  description: string;
  tags: string[];
  channelName: string;
  channelId?: string;
  uploadDate?: string;
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'this', 'that', 'you', 'your', 'official', 'video', 'audio', 'music',
  'los', 'las', 'del', 'con', 'para', 'por', 'una', 'uno', 'que', 'por', 'como', 'sus', 'feat', 'full', 'new',
  'nuevo', 'nueva', 'oficial', 'letra', 'lyrics', 'lyric', 'live', 'hd', '4k',
]);

// ───────────────────────── utilidades ─────────────────────────

export function normalizeTag(tag: string): string {
  return tag.replace(/^#/, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

/** Minúsculas y sin acentos, solo para comparar ("Reggaetón" == "reggaeton"). */
function fold(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function uniqueCI(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const key = fold(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item.trim());
  }
  return out;
}

function percent(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function avg(nums: number[]): number {
  return nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0;
}

function titleCase(text: string): string {
  return text.replace(/\b([a-záéíóúñü])([a-záéíóúñü]*)/gi, (_m, a: string, b: string) => a.toUpperCase() + b);
}

export function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\p{L}\p{N}_]{2,40}/gu) || [];
  return uniqueCI(matches.map((h) => h.replace(/^#/, '')));
}

export function hasTimestamps(text: string): boolean {
  return (text.match(/^\s*\(?\d{1,2}:\d{2}/gm) || []).length >= 2;
}

function hasPlatformLinks(text: string): boolean {
  return /spotify|apple\s*music|music\.apple|soundcloud|deezer|bandcamp|tidal|amazon\.com\/music|instagram|tiktok|linktr\.ee|ffm\.to|lnk\.to|smarturl/i.test(
    text
  );
}

function hasYear(text: string): boolean {
  return /\b(20[1-3]\d)\b/.test(text);
}

function competitorTags(raw: RawCompetitor): string[] {
  const all = [...raw.tags, ...extractHashtags(raw.description)];
  return uniqueCI(all.map(normalizeTag).filter((t) => t.length >= 2 && t.length <= 60)).slice(0, 40);
}

// ───────────────────────── competidores ─────────────────────────

function successFactor(raw: RawCompetitor, tagCount: number): string {
  const parts: string[] = [];
  if (raw.viewsNumeric && raw.ageDays !== null) {
    const perDay = Math.round(raw.viewsNumeric / Math.max(raw.ageDays, 1));
    parts.push(`≈ ${perDay.toLocaleString('es-ES')} vistas/día`);
  } else if (raw.viewsNumeric) {
    parts.push(`${raw.viewsNumeric.toLocaleString('es-ES')} vistas`);
  }
  if (tagCount) parts.push(`${tagCount} etiquetas`);
  parts.push(`título de ${raw.title.length} caracteres`);
  if (/[\(\[]/.test(raw.title)) parts.push('formato entre paréntesis en el título');
  if (hasYear(raw.title)) parts.push('año en el título');
  if (hasTimestamps(raw.description)) parts.push('marcas de tiempo en la descripción');
  if (extractHashtags(raw.description).length) parts.push('hashtags en la descripción');
  if (hasPlatformLinks(raw.description)) parts.push('enlaces a plataformas/redes');
  return parts.join(' · ');
}

export function buildCompetitors(raws: RawCompetitor[]): CompetitorVideo[] {
  return [...raws]
    .sort((a, b) => b.viewsNumeric - a.viewsNumeric)
    .map((raw, idx) => {
      const tags = competitorTags(raw);
      const cleanDesc = raw.description.replace(/\s+/g, ' ').trim();
      return {
        rank: idx + 1,
        title: raw.title,
        channel: raw.channel,
        views: formatViewsEs(raw.viewsNumeric),
        viewsNumeric: raw.viewsNumeric,
        published: raw.publishedText || formatAgeEs(raw.ageDays),
        url: `https://www.youtube.com/watch?v=${raw.videoId}`,
        videoId: raw.videoId,
        thumbnail: `https://i.ytimg.com/vi/${raw.videoId}/mqdefault.jpg`,
        tags,
        descriptionSummary: cleanDesc.length > 180 ? cleanDesc.slice(0, 177) + '…' : cleanDesc,
        keySuccessFactor: successFactor(raw, tags.length),
      };
    });
}

// ───────────────────────── matriz de etiquetas ─────────────────────────

export function buildTagMatrix(
  competitors: CompetitorVideo[],
  userTags: string[]
): TagMatrixItem[] {
  const total = competitors.length;
  if (total === 0) return [];

  const channelKeys = competitors.map((c) => normalizeName(c.channel)).filter((k) => k.length >= 4);
  const totalViews = competitors.reduce((sum, c) => sum + (c.viewsNumeric || 0), 0) || 1;
  const userSet = new Set(userTags.map((t) => fold(normalizeTag(t))));

  const stats = new Map<string, { count: number; channels: string[]; views: number; variants: Map<string, number> }>();
  for (const comp of competitors) {
    // una etiqueta cuenta una sola vez por video, aunque aparezca con y sin acento
    const perVideo = new Map<string, string>();
    for (const tag of comp.tags) {
      const key = fold(tag);
      if (!perVideo.has(key)) perVideo.set(key, tag);
    }
    for (const [key, original] of perVideo) {
      // las etiquetas que son el nombre de otro canal no sirven para tu video
      const nameKey = normalizeName(key);
      if (nameKey.length >= 4 && channelKeys.some((ck) => ck === nameKey || ck.includes(nameKey) || nameKey.includes(ck))) continue;
      const s = stats.get(key) || { count: 0, channels: [], views: 0, variants: new Map<string, number>() };
      s.count += 1;
      s.channels.push(comp.channel);
      s.views += comp.viewsNumeric || 0;
      s.variants.set(original, (s.variants.get(original) || 0) + 1);
      stats.set(key, s);
    }
  }

  return Array.from(stats.entries())
    .sort((a, b) => b[1].count - a[1].count || b[1].views - a[1].views)
    .slice(0, 80)
    .map(([key, s]) => {
      const tag = Array.from(s.variants.entries()).sort((a, b) => b[1] - a[1])[0][0];
      const pct = percent(s.count, total);
      const repeated = s.count >= 2; // con 1 solo video no hay "tendencia"

      let category = 'Long-Tail';
      if (repeated && pct >= 60) category = 'Nicho Principal';
      else if (repeated && pct >= 30) category = 'Alto Volumen';
      else if (/\b(20[1-3]\d)\b|live|directo|vivo|official|oficial|nuevo|new/.test(key)) category = 'Tendencia / Temporal';

      let recommendation = 'Opcional';
      if (repeated && pct >= 50) recommendation = 'Imprescindible';
      else if (repeated && pct >= 25) recommendation = 'Muy Recomendada';

      // parte de las visualizaciones totales que acumulan los videos que usan esta etiqueta (0..1)
      const viewShare = Math.min(1, s.views / totalViews);
      const impact = Math.max(1, Math.min(100, Math.round(pct * 0.6 + viewShare * 100 * 0.4)));

      return {
        tag,
        frequency: s.count,
        frequencyPercentage: pct,
        videosUsing: s.channels,
        accumulatedViews: formatViewsEs(s.views),
        impactScore: impact,
        category,
        recommendation,
        userHasTag: userSet.has(key),
      };
    });
}

// ───────────────────────── patrones comunes ─────────────────────────

export interface CompetitorStats {
  n: number;
  avgTitleLength: number;
  avgTags: number;
  dashShare: number;
  parenShare: number;
  pipeShare: number;
  yearShare: number;
  timestampShare: number;
  hashtagShare: number;
  linksShare: number;
  topWords: string[];
  topHashtags: string[];
}

export function computeCompetitorStats(raws: RawCompetitor[]): CompetitorStats {
  const n = raws.length;
  const wordCount = new Map<string, number>();
  const hashCount = new Map<string, number>();

  for (const r of raws) {
    const words = new Set(
      (r.title.toLowerCase().match(/[a-záéíóúñü0-9']{3,}/g) || []).filter((w) => !STOPWORDS.has(w) && !/^\d+$/.test(w))
    );
    words.forEach((w) => wordCount.set(w, (wordCount.get(w) || 0) + 1));
    extractHashtags(r.description).forEach((h) => {
      const key = h.toLowerCase();
      hashCount.set(key, (hashCount.get(key) || 0) + 1);
    });
  }

  const top = (m: Map<string, number>, k: number, min = 2) =>
    Array.from(m.entries())
      .filter(([, c]) => c >= min)
      .sort((a, b) => b[1] - a[1])
      .slice(0, k)
      .map(([w]) => w);

  return {
    n,
    avgTitleLength: avg(raws.map((r) => r.title.length)),
    avgTags: avg(raws.map((r) => competitorTags(r).length)),
    dashShare: percent(raws.filter((r) => /\s[-–—]\s/.test(r.title)).length, n),
    parenShare: percent(raws.filter((r) => /[\(\[]/.test(r.title)).length, n),
    pipeShare: percent(raws.filter((r) => /\s\|\s/.test(r.title)).length, n),
    yearShare: percent(raws.filter((r) => hasYear(r.title)).length, n),
    timestampShare: percent(raws.filter((r) => hasTimestamps(r.description)).length, n),
    hashtagShare: percent(raws.filter((r) => extractHashtags(r.description).length > 0).length, n),
    linksShare: percent(raws.filter((r) => hasPlatformLinks(r.description)).length, n),
    topWords: top(wordCount, 10),
    topHashtags: top(hashCount, 6, 2).map((h) => `#${h}`),
  };
}

export function buildCommonPatterns(s: CompetitorStats): CommonPatterns {
  if (s.n === 0) {
    return { titleAvgLength: 0, popularTitleWords: [], popularFormulas: [], descriptionPatterns: [], hashtagsCommon: [] };
  }
  const formulas: string[] = [];
  if (s.dashShare >= 30) formulas.push(`${s.dashShare}% de los títulos separan con un guion («Artista - Título»).`);
  if (s.parenShare >= 30) formulas.push(`${s.parenShare}% añade el formato entre paréntesis o corchetes (ej. Official Video, Live).`);
  if (s.pipeShare >= 30) formulas.push(`${s.pipeShare}% usa «|» para añadir palabras clave al final del título.`);
  if (s.yearShare >= 20) formulas.push(`${s.yearShare}% incluye el año en el título.`);
  if (formulas.length === 0) formulas.push('No hay un formato de título dominante entre los videos analizados.');

  const patterns: string[] = [
    `${s.timestampShare}% incluye marcas de tiempo en la descripción.`,
    `${s.linksShare}% enlaza a plataformas o redes (Spotify, Instagram...).`,
    `${s.hashtagShare}% usa hashtags en la descripción.`,
  ];

  return {
    titleAvgLength: s.avgTitleLength,
    popularTitleWords: s.topWords.map(titleCase),
    popularFormulas: formulas,
    descriptionPatterns: patterns,
    hashtagsCommon: s.topHashtags,
  };
}

// ───────────────────────── puntuación SEO ─────────────────────────

export function scoreSeo(
  video: { title: string; description: string; tags: string[] },
  matrix: TagMatrixItem[],
  avgCompetitorTags: number
): number {
  const top = matrix.slice(0, 10).map((t) => t.tag);
  const userTagSet = new Set(video.tags.map((t) => fold(normalizeTag(t))));
  const tagCoverage = top.length ? top.filter((t) => userTagSet.has(fold(t))).length / top.length : 0.5;

  const targetTags = avgCompetitorTags || 10;
  const tagsCountScore = Math.min(video.tags.length / targetTags, 1);

  const len = video.title.length;
  const titleScore = len === 0 ? 0 : Math.max(0, 1 - Math.abs(len - 55) / 55);

  const desc = video.description || '';
  let descScore = 0;
  if (desc.length >= 200) descScore += 0.5;
  else if (desc.length >= 80) descScore += 0.25;
  if (extractHashtags(desc).length > 0) descScore += 0.25;
  if (/https?:\/\//.test(desc)) descScore += 0.25;

  const firstLines = desc.slice(0, 150).toLowerCase();
  const hookKeywords = (top.length ? top : video.tags.map(normalizeTag)).slice(0, 5);
  const hookScore = hookKeywords.some((k) => k && firstLines.includes(k)) ? 1 : 0;

  const tagChars = video.tags.join(', ').length;
  const tagLimitScore = tagChars > 0 && tagChars <= 500 ? 1 : 0;

  const score = tagCoverage * 35 + tagsCountScore * 15 + titleScore * 15 + descScore * 15 + hookScore * 10 + tagLimitScore * 10;
  return Math.max(5, Math.min(100, Math.round(score)));
}

// ───────────────────────── análisis del video del usuario ─────────────────────────

export function analyzeUserVideo(
  user: UserVideoInput,
  matrix: TagMatrixItem[],
  stats: CompetitorStats
) {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const tagChars = user.tags.join(', ').length;
  const len = user.title.length;

  if (len >= 30 && len <= 70) strengths.push(`El título mide ${len} caracteres: cabe completo en móvil.`);
  else if (len > 70) weaknesses.push(`El título mide ${len} caracteres; por encima de ~70 se corta en móvil.`);
  else if (len > 0) weaknesses.push(`El título es muy corto (${len} caracteres); hay espacio para añadir palabras clave.`);

  if (user.tags.length === 0) weaknesses.push('El video no tiene etiquetas.');
  else if (tagChars <= 500) strengths.push(`Tienes ${user.tags.length} etiquetas (${tagChars}/500 caracteres).`);
  else weaknesses.push(`Las etiquetas suman ${tagChars} caracteres y superan el límite de 500.`);

  if (stats.n > 0 && user.tags.length < stats.avgTags) {
    weaknesses.push(`Usas ${user.tags.length} etiquetas; la competencia analizada usa ${stats.avgTags} de media.`);
  }

  const mustHave = matrix.filter((t) => t.recommendation === 'Imprescindible');
  const missingMust = mustHave.filter((t) => !t.userHasTag);
  if (mustHave.length > 0) {
    if (missingMust.length === 0) strengths.push('Ya incluyes todas las etiquetas imprescindibles de la competencia.');
    else
      weaknesses.push(
        `Te faltan ${missingMust.length} etiquetas muy repetidas por la competencia (ej. ${missingMust
          .slice(0, 3)
          .map((t) => `"${t.tag}"`)
          .join(', ')}).`
      );
  }

  const desc = user.description || '';
  if (desc.length < 150) weaknesses.push('La descripción es corta; conviene ampliarla con contexto, enlaces y hashtags.');
  else strengths.push('La descripción tiene una extensión adecuada.');
  if (extractHashtags(desc).length === 0) weaknesses.push('La descripción no tiene hashtags.');
  else strengths.push('La descripción incluye hashtags.');

  return {
    titleLength: len,
    tagsCount: user.tags.length,
    tagsCharacterCount: tagChars,
    strengths,
    weaknesses,
    seoScoreCurrent: scoreSeo(user, matrix, stats.avgTags),
  };
}

// ───────────────────────── sugerencias (misma lógica del video) ─────────────────────────

interface SuggestionContext {
  user: UserVideoInput;
  profile: ContentProfile;
  matrix: TagMatrixItem[];
  stats: CompetitorStats;
  parsed: { artist?: string; song: string; feat?: string };
}

function clip(text: string, max = 100): string {
  return text.length <= max ? text : text.slice(0, max - 1).trimEnd() + '…';
}

function firstGenreWord(genre?: string): string | undefined {
  return genre ? genre.split(' / ')[0] : undefined;
}

function keywordsIn(title: string, candidates: Array<string | undefined>): string[] {
  const low = fold(title);
  return uniqueCI(candidates.filter((c): c is string => !!c && low.includes(fold(c))));
}

function bestExtraKeyword(ctx: SuggestionContext, title: string): string | undefined {
  const low = fold(title);
  const own = [ctx.parsed.artist, ctx.parsed.song].filter(Boolean).map((s) => fold(s!));
  // palabras que ya aparecen en otras opciones (género, formato) no aportan variedad
  const used = [ctx.profile.genre, ...(ctx.profile.genre ? ctx.profile.genre.split(' / ') : []), ctx.profile.format]
    .filter(Boolean)
    .map((s) => fold(s!));
  const candidate = ctx.matrix
    .filter((t) => t.frequency >= 2 || ctx.stats.n < 4)
    .find((t) => {
      const key = fold(t.tag);
      return (
        key.length <= 24 &&
        !/\b20[1-3]\d\b/.test(key) &&
        !low.includes(key) &&
        !used.some((u) => u === key || key.includes(u) || u.includes(key)) &&
        !own.some((o) => o.includes(key) || key.includes(o))
      );
    });
  return candidate ? titleCase(candidate.tag) : undefined;
}

function buildTitles(ctx: SuggestionContext, year: string): SuggestedTitle[] {
  const { profile, parsed, stats } = ctx;
  const out: SuggestedTitle[] = [];
  const seen = new Set<string>();
  const push = (style: string, title: string, why: string, extras: Array<string | undefined>) => {
    const t = clip(title.replace(/\s+/g, ' ').trim());
    const key = t.toLowerCase();
    if (!t || seen.has(key)) return;
    seen.add(key);
    out.push({
      style,
      title: t,
      characterCount: t.length,
      whyItWorks: why,
      includedKeywords: keywordsIn(t, extras),
    });
  };

  if (profile.kind === 'music') {
    const artist = parsed.artist;
    const songFull = parsed.song + (parsed.feat ? ` (${parsed.feat})` : '');
    const label = profile.format;
    const genre = firstGenreWord(profile.genre);
    const core = artist ? `${artist} - ${songFull}` : songFull;
    const labelPart = label ? ` (${label})` : '';
    const extras = [artist, parsed.song, genre, label, year];

    const dashNote =
      stats.n > 0 ? `${stats.dashShare}% de los videos de la comparativa usan este mismo formato.` : 'Es el formato más reconocible para música.';
    push(
      'Clásico: Artista - Canción',
      `${core}${labelPart}`,
      `Conserva tu video tal cual es (mismo artista, canción${label ? ' y formato' : ''}) con el orden que YouTube y los oyentes esperan. ${dashNote}`,
      extras
    );

    push(
      'Búsqueda: canción primero',
      `${songFull}${artist ? ` - ${artist}` : ''}${genre ? ` | ${genre}` : ''}`,
      'Empieza por el nombre de la canción, que es lo que la gente escribe al buscarla, y añade el género para aparecer también en búsquedas por estilo.',
      extras
    );

    if (genre || year) {
      push(
        'Género + año',
        `${core}${labelPart} | ${[genre, year].filter(Boolean).join(' ')}`,
        'Añade el género y el año como palabras clave tras «|», sin cambiar el título principal.',
        extras
      );
    }

    const extra = bestExtraKeyword(ctx, `${core}${labelPart}`);
    if (extra) {
      push(
        'Palabra clave del nicho',
        `${core}${labelPart} | ${extra}`,
        `«${extra}» es una de las etiquetas más repetidas en los videos recientes y populares del mismo nicho.`,
        [...extras, extra]
      );
    }

    push(
      'Corto y limpio (móvil)',
      core,
      'Sin paréntesis ni extras: se lee completo en la lista de recomendados del móvil.',
      extras
    );

    if (year) {
      push(
        'Con año',
        `${core}${label ? ` (${label})` : ''} ${year}`,
        'Incluir el año ayuda a aparecer en búsquedas recientes del tipo «canción + año».',
        extras
      );
    }
    return out;
  }

  // Contenido general: se mantiene el título del usuario como base
  const head = ctx.user.title.split(/\s+\|\s+/)[0].trim();
  const extra = bestExtraKeyword(ctx, ctx.user.title);
  const userKw = ctx.user.tags.map(normalizeTag).filter((t) => t.length > 2)[0];
  push('Base: tu título actual', ctx.user.title, 'Tu título tal cual, como punto de referencia.', [head, userKw]);
  if (extra) {
    push(
      'Con palabra clave del nicho',
      `${head} | ${extra}`,
      `«${extra}» aparece en varios de los videos recientes más vistos del mismo tema.`,
      [head, extra]
    );
    push(
      'Palabra clave primero',
      `${extra} | ${head}`,
      'Pone primero la palabra clave más buscada; el resto del título da contexto.',
      [head, extra]
    );
  }
  if (year) push('Con año', `${head} ${year}`, 'El año ayuda a aparecer en búsquedas recientes.', [head, year]);
  push('Corto (móvil)', head, 'Se lee completo en pantallas pequeñas.', [head]);
  return out;
}

function buildTagPack(ctx: SuggestionContext) {
  const { profile, parsed, matrix, stats, user } = ctx;
  const identity: string[] = [];
  if (profile.kind === 'music') {
    if (parsed.artist) identity.push(parsed.artist);
    identity.push(parsed.song);
    if (parsed.artist) identity.push(`${parsed.artist} ${parsed.song}`);
    if (profile.genre) identity.push(...profile.genre.split(' / '));
    if (profile.format) identity.push(profile.format);
  }
  const minFreq = stats.n >= 4 ? 2 : 1;
  const proven = matrix.filter((t) => t.frequency >= minFreq);
  const must = proven.filter((t) => t.recommendation === 'Imprescindible').map((t) => t.tag);
  const rec = proven.filter((t) => t.recommendation === 'Muy Recomendada').map((t) => t.tag);
  const opt = proven.filter((t) => t.recommendation === 'Opcional').map((t) => t.tag);

  const ordered = uniqueCI([...identity, ...must, ...user.tags, ...rec, ...opt]);
  const list: string[] = [];
  let length = 0;
  for (const tag of ordered) {
    const add = list.length === 0 ? tag.length : tag.length + 2;
    if (length + add > 475) continue;
    list.push(tag);
    length += add;
  }

  const inList = (arr: string[]) => uniqueCI(arr.filter((t) => list.some((l) => l.toLowerCase() === t.toLowerCase())));
  return {
    list,
    primary: inList([...identity, ...must]).slice(0, 8),
    secondary: inList([...user.tags, ...rec]).slice(0, 8),
    longTail: inList(opt).slice(0, 8),
  };
}

function buildDescription(ctx: SuggestionContext) {
  const { profile, parsed, user } = ctx;
  const es = profile.language === 'es';
  const original = (user.description || '').trim();
  const originalHashtags = extractHashtags(original);

  const bodyLines = original
    .split('\n')
    .filter((line) => !/^\s*(#[\p{L}\p{N}_]+\s*)+$/u.test(line));
  // si la primera línea original solo repite el título, ya la cubre el nuevo gancho
  const firstKey = fold(bodyLines.find((l) => l.trim())?.replace(/[()\[\]]/g, '') || '');
  const titleKeys = [user.title, parsed.artist ? `${parsed.artist} - ${parsed.song}` : parsed.song].map((t) =>
    fold(t.replace(/[()\[\]]/g, ''))
  );
  if (firstKey && titleKeys.includes(firstKey)) bodyLines.splice(bodyLines.findIndex((l) => l.trim()), 1);
  const body = bodyLines.join('\n').trim();

  let line1: string;
  let line2: string;
  if (profile.kind === 'music') {
    const label = profile.format ? ` (${profile.format})` : '';
    const genre = firstGenreWord(profile.genre);
    line1 = `🎵 ${parsed.artist ? `${parsed.artist} - ` : ''}${parsed.song}${label}${genre ? ` | ${genre}` : ''}`;
    line2 = es
      ? `Escucha «${parsed.song}»${parsed.artist ? ` de ${parsed.artist}` : ''} y suscríbete para no perderte más música${genre ? ` de ${genre}` : ''}.`
      : `Listen to "${parsed.song}"${parsed.artist ? ` by ${parsed.artist}` : ''} and subscribe for more${genre ? ` ${genre}` : ''} music.`;
  } else {
    const head = user.title.split(/\s+\|\s+/)[0].trim();
    line1 = head;
    const kw = user.tags.slice(0, 3).join(', ');
    line2 = es
      ? `${kw ? `Sobre: ${kw}. ` : ''}Suscríbete al canal para ver más videos como este.`
      : `${kw ? `About: ${kw}. ` : ''}Subscribe to the channel for more videos like this.`;
  }

  const needsCta = !/suscr[ií]b|subscribe/i.test(original);
  const cta = needsCta
    ? user.channelId
      ? `🔔 ${es ? 'Suscríbete' : 'Subscribe'}: https://www.youtube.com/channel/${user.channelId}?sub_confirmation=1`
      : `🔔 ${es ? 'Suscríbete al canal para más videos' : 'Subscribe to the channel for more videos'}`
    : '';

  const newHashtags: string[] = [];
  if (profile.kind === 'music') {
    if (parsed.artist) newHashtags.push(parsed.artist.replace(/[^\p{L}\p{N}]+/gu, ''));
    if (profile.genre) newHashtags.push(...profile.genre.split(' / ').map((g) => g.replace(/[^\p{L}\p{N}]+/gu, '')));
  }
  ctx.matrix
    .filter((t) => t.recommendation === 'Imprescindible' && t.tag.length <= 24)
    .slice(0, 3)
    .forEach((t) => newHashtags.push(t.tag.replace(/[^\p{L}\p{N}]+/gu, '')));
  const hashtags = uniqueCI([...originalHashtags, ...newHashtags].filter((h) => h.length >= 2)).slice(0, 6);

  const fullText = [
    `${line1}\n${line2}`,
    body,
    cta,
    hashtags.map((h) => `#${h}`).join(' '),
  ]
    .filter((block) => block && block.trim())
    .join('\n\n');

  const timestamps = original
    .split('\n')
    .filter((l) => /^\s*\(?\d{1,2}:\d{2}/.test(l))
    .join('\n');

  return {
    fullText,
    firstTwoLinesSnippet: clip(`${line1} ${line2}`, 155),
    suggestedTimestampsTemplate: timestamps,
    suggestedHashtags: hashtags.map((h) => `#${h}`),
  };
}

function buildAdvice(ctx: SuggestionContext) {
  const { stats, matrix, user, profile } = ctx;
  const advice: OptimizedSuggestions['strategicAdvice'] = [];

  if (stats.n > 0) {
    const topTags = matrix.slice(0, 3).map((t) => `«${t.tag}» (${t.frequency}/${stats.n})`).join(', ');
    const missing = matrix.filter((t) => t.recommendation !== 'Opcional' && !t.userHasTag && t.frequency >= 2).slice(0, 4);
    advice.push({
      aspect: 'Etiquetas',
      competitorTrend: `Las más repetidas entre los ${stats.n} videos analizados: ${topTags || 'sin coincidencias claras'}. Media: ${stats.avgTags} etiquetas por video.`,
      actionableRecommendation: missing.length
        ? `Valora añadir ${missing.map((t) => `«${t.tag}»`).join(', ')}, siempre que describan de verdad tu video.`
        : 'Ya cubres las etiquetas más repetidas; mantén solo las que describan tu video.',
    });

    const len = user.title.length;
    advice.push({
      aspect: 'Título',
      competitorTrend: `Longitud media ${stats.avgTitleLength} caracteres; ${stats.dashShare}% separa con guion y ${stats.parenShare}% añade el formato entre paréntesis.`,
      actionableRecommendation:
        len > 70
          ? `Tu título mide ${len} caracteres: acórtalo por debajo de ~70 para que no se corte en móvil.`
          : `Tu título mide ${len} caracteres; prueba las opciones de arriba y compáralas con ${stats.avgTitleLength} de media.`,
    });

    const desc = user.description || '';
    const lacking: string[] = [];
    if (stats.timestampShare >= 30 && !hasTimestamps(desc)) lacking.push('marcas de tiempo');
    if (stats.linksShare >= 30 && !hasPlatformLinks(desc)) lacking.push('enlaces a plataformas/redes');
    if (stats.hashtagShare >= 30 && extractHashtags(desc).length === 0) lacking.push('hashtags');
    advice.push({
      aspect: 'Descripción',
      competitorTrend: `${stats.timestampShare}% incluye marcas de tiempo, ${stats.linksShare}% enlaza a plataformas/redes y ${stats.hashtagShare}% usa hashtags.`,
      actionableRecommendation: lacking.length
        ? `Tu descripción no tiene ${lacking.join(', ')}: añádelos si aplican a tu video.`
        : 'Tu descripción ya cubre lo que más usa la competencia.',
    });
  } else {
    advice.push({
      aspect: 'Comparativa',
      competitorTrend: 'No se pudieron leer videos competidores reales en este intento.',
      actionableRecommendation: 'Las sugerencias se basan solo en tu video. Vuelve a intentarlo en unos minutos para comparar con la competencia.',
    });
  }

  if (profile.kind === 'music') {
    advice.push({
      aspect: 'Gancho inicial',
      competitorTrend: 'Buena práctica habitual en música (no sale de los datos de la comparativa).',
      actionableRecommendation:
        'Coloca lo más potente (estribillo, drop o imagen principal) en los primeros 15–30 segundos para mejorar la retención.',
    });
  }

  advice.push({
    aspect: 'Miniatura',
    competitorTrend: 'Compara visualmente tu miniatura con las de los videos de la comparativa.',
    actionableRecommendation:
      'Busca alto contraste, un solo elemento principal y poco texto. Puedes subirla en «Analizar Miniatura / Video con IA» para una evaluación.',
  });

  return advice;
}

export function buildLocalSuggestions(
  user: UserVideoInput,
  profile: ContentProfile,
  matrix: TagMatrixItem[],
  stats: CompetitorStats,
  parsed: { artist?: string; song: string; feat?: string }
): OptimizedSuggestions {
  const ctx: SuggestionContext = { user, profile, matrix, stats, parsed };
  const year = (user.uploadDate && /^\d{4}/.test(user.uploadDate) ? user.uploadDate.slice(0, 4) : String(new Date().getFullYear()));

  const titles = buildTitles(ctx, year);
  const tags = buildTagPack(ctx);
  const description = buildDescription(ctx);
  const formatted = tags.list.join(', ');

  const predicted = scoreSeo(
    { title: titles[0]?.title || user.title, description: description.fullText, tags: tags.list },
    matrix,
    stats.avgTags
  );

  return {
    predictedSeoScore: predicted,
    titles,
    description,
    tags: {
      formattedCommaSeparated: formatted,
      totalCharacters: formatted.length,
      tagList: tags.list,
      breakdown: { primary: tags.primary, secondary: tags.secondary, longTail: tags.longTail },
    },
    strategicAdvice: buildAdvice(ctx),
  };
}

// ───────────────────────── consultas de búsqueda ─────────────────────────

export function buildSearchQueries(
  user: UserVideoInput,
  profile: ContentProfile,
  parsed: { artist?: string; song: string },
  customQuery?: string
): string[] {
  const queries: string[] = [];
  const custom = (customQuery || '').trim();
  if (custom) queries.push(custom);

  if (profile.kind === 'music') {
    const genre = firstGenreWord(profile.genre);
    const format = profile.format?.toLowerCase();
    if (genre && format) queries.push(`${genre} ${format}`);
    if (genre) queries.push(`${genre} ${profile.language === 'es' ? 'música nueva' : 'new music'}`);
    const userTags = user.tags.map(normalizeTag).filter((t) => t.length > 2 && t.length <= 30);
    const generic = userTags.filter(
      (t) => !(parsed.artist && t.includes(parsed.artist.toLowerCase())) && !t.includes(parsed.song.toLowerCase())
    );
    if (generic.length) queries.push(generic.slice(0, 3).join(' '));
    if (!genre && !format && !generic.length) queries.push(`${profile.language === 'es' ? 'música' : 'music'} ${format || 'video'}`);
  } else {
    const titleKernel = user.title.replace(/[\(\)\[\]\|]/g, ' ').replace(/\s+/g, ' ').trim();
    const userTags = user.tags.map(normalizeTag).filter((t) => t.length > 2);
    if (userTags.length) queries.push(userTags.slice(0, 3).join(' '));
    if (titleKernel) queries.push(titleKernel.split(' ').slice(0, 6).join(' '));
  }
  return uniqueCI(queries).slice(0, 4);
}

// ───────────────────────── ensamblado ─────────────────────────

export function assembleBenchmark(args: {
  user: UserVideoInput;
  profile: ContentProfile;
  parsed: { artist?: string; song: string; feat?: string };
  raws: RawCompetitor[];
  queryUsed: string;
  timeframeLabel: string;
  dataSource: 'youtube' | 'gemini' | 'none';
  warnings?: string[];
}): BenchmarkResult {
  const { user, profile, parsed, raws } = args;
  const competitors = buildCompetitors(raws);
  const matrix = buildTagMatrix(competitors, user.tags);
  const stats = computeCompetitorStats(raws);
  const patterns = buildCommonPatterns(stats);
  const analysis = analyzeUserVideo(user, matrix, stats);
  const suggestions = buildLocalSuggestions(user, profile, matrix, stats, parsed);

  return {
    searchContext: {
      queryUsed: args.queryUsed,
      timeframe: args.timeframeLabel,
      totalVideosAnalyzed: competitors.length,
    },
    contentProfile: profile,
    dataSource: args.dataSource,
    warnings: args.warnings && args.warnings.length ? args.warnings : undefined,
    userVideoAnalysis: analysis,
    competitors,
    tagMatrix: matrix,
    commonPatterns: patterns,
    optimizedSuggestions: suggestions,
  };
}

/** Recalcula los campos derivados (recuentos, límite de 500 caracteres) de unas sugerencias externas. */
export function normalizeSuggestions(
  candidate: any,
  fallback: OptimizedSuggestions,
  matrix: TagMatrixItem[],
  avgCompetitorTags: number
): OptimizedSuggestions | null {
  try {
    const titlesRaw = Array.isArray(candidate?.titles) ? candidate.titles : [];
    const titles: SuggestedTitle[] = titlesRaw
      .filter((t: any) => t && typeof t.title === 'string' && t.title.trim().length > 0)
      .slice(0, 8)
      .map((t: any) => {
        const title = clip(String(t.title).trim());
        return {
          style: typeof t.style === 'string' ? t.style : 'Opción',
          title,
          characterCount: title.length,
          whyItWorks: typeof t.whyItWorks === 'string' ? t.whyItWorks : '',
          includedKeywords: Array.isArray(t.includedKeywords) ? t.includedKeywords.map(String) : [],
        };
      });
    if (titles.length < 3) return null;

    const tagListRaw: string[] = Array.isArray(candidate?.tags?.tagList)
      ? candidate.tags.tagList.map(String)
      : typeof candidate?.tags?.formattedCommaSeparated === 'string'
      ? candidate.tags.formattedCommaSeparated.split(',')
      : [];
    const tagList: string[] = [];
    let length = 0;
    for (const tag of uniqueCI(tagListRaw.map((t) => t.trim()).filter(Boolean))) {
      const add = tagList.length === 0 ? tag.length : tag.length + 2;
      if (length + add > 475) continue;
      tagList.push(tag);
      length += add;
    }
    if (tagList.length === 0) return null;

    const fullText = typeof candidate?.description?.fullText === 'string' ? candidate.description.fullText.trim() : '';
    if (!fullText) return null;
    const hashtags: string[] = Array.isArray(candidate?.description?.suggestedHashtags)
      ? candidate.description.suggestedHashtags.map((h: any) => `#${String(h).replace(/^#/, '')}`)
      : extractHashtags(fullText).map((h) => `#${h}`);

    const formatted = tagList.join(', ');
    const breakdownRaw = candidate?.tags?.breakdown || {};
    const arr = (x: any) => (Array.isArray(x) ? x.map(String) : []);

    return {
      predictedSeoScore: scoreSeo({ title: titles[0].title, description: fullText, tags: tagList }, matrix, avgCompetitorTags),
      titles,
      description: {
        fullText,
        firstTwoLinesSnippet:
          typeof candidate?.description?.firstTwoLinesSnippet === 'string' && candidate.description.firstTwoLinesSnippet
            ? candidate.description.firstTwoLinesSnippet
            : clip(fullText.split('\n').slice(0, 2).join(' '), 155),
        suggestedTimestampsTemplate:
          typeof candidate?.description?.suggestedTimestampsTemplate === 'string'
            ? candidate.description.suggestedTimestampsTemplate
            : '',
        suggestedHashtags: hashtags.slice(0, 6),
      },
      tags: {
        formattedCommaSeparated: formatted,
        totalCharacters: formatted.length,
        tagList,
        breakdown: {
          primary: arr(breakdownRaw.primary).length ? arr(breakdownRaw.primary) : tagList.slice(0, 6),
          secondary: arr(breakdownRaw.secondary).length ? arr(breakdownRaw.secondary) : tagList.slice(6, 12),
          longTail: arr(breakdownRaw.longTail).length ? arr(breakdownRaw.longTail) : tagList.slice(12, 18),
        },
      },
      // Los consejos con datos reales siempre vienen del cálculo local
      strategicAdvice: fallback.strategicAdvice,
    };
  } catch {
    return null;
  }
}
