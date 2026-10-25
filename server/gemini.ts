/**
 * Uso opcional de Gemini (solo si hay GEMINI_API_KEY):
 *  - redactar títulos/descripción/etiquetas respetando el tipo de video
 *  - proponer enlaces de competidores cuando YouTube no se pudo leer directamente
 *
 * Cualquier fallo devuelve null y la app sigue con el cálculo local.
 */

import { ThinkingLevel, type GoogleGenAI } from '@google/genai';
import type { CompetitorVideo, ContentProfile, TagMatrixItem } from '../src/types/index.ts';
import type { CompetitorStats, UserVideoInput } from './benchmark.ts';

const GEMINI_TIMEOUT_MS = 70000;
const MODEL = 'gemini-3.8-flash';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Gemini tardó demasiado en responder')), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

function parseJson(text: string | undefined): any {
  const cleaned = (text || '{}')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  return JSON.parse(cleaned);
}

export function describeProfile(profile: ContentProfile): string {
  if (profile.kind === 'music') {
    return [
      'MÚSICA',
      profile.genre ? `género: ${profile.genre}` : null,
      profile.format ? `formato: ${profile.format}` : null,
      profile.artist ? `artista: ${profile.artist}` : null,
      profile.song ? `canción: ${profile.song}` : null,
    ]
      .filter(Boolean)
      .join(' | ');
  }
  return 'CONTENIDO GENERAL (no es un video musical)';
}

export async function generateSuggestionsWithGemini(
  ai: GoogleGenAI,
  args: {
    user: UserVideoInput;
    profile: ContentProfile;
    competitors: CompetitorVideo[];
    matrix: TagMatrixItem[];
    stats: CompetitorStats;
    enableThinking: boolean;
  }
): Promise<any | null> {
  const { user, profile, competitors, matrix, stats } = args;
  const lang = profile.language === 'es' ? 'español' : 'inglés';

  const competitorLines = competitors
    .slice(0, 10)
    .map((c) => `- "${c.title}" | ${c.channel} | ${c.views} | etiquetas: ${c.tags.slice(0, 10).join(', ') || '—'}`)
    .join('\n');
  const topTags = matrix
    .slice(0, 15)
    .map((t) => `${t.tag} (${t.frequency}/${stats.n})`)
    .join(', ');

  const musicRules =
    profile.kind === 'music'
      ? `
REGLAS ESPECÍFICAS PARA MÚSICA
- Mantén siempre artista, canción${profile.genre ? ', género' : ''}${profile.format ? ' y formato' : ''} tal como están. No cambies el formato (por ejemplo, un videoclip no pasa a ser un directo, un lyric video ni un mix).
- Las variaciones de título cambian el ORDEN, las PALABRAS CLAVE y el nivel de detalle (canción primero, género, año, formato entre paréntesis, versión corta para móvil...), nunca el concepto del video.
- Para la descripción, 2 primeras líneas con artista, canción y género; después, lo que el usuario ya escribió (créditos, enlaces, letras, marcas de tiempo).`
      : '';

  const prompt = `Eres un experto en SEO de YouTube. Optimiza los metadatos de UN video concreto SIN cambiar su naturaleza.

VIDEO DEL USUARIO
- Tipo detectado: ${describeProfile(profile)}
- Canal: "${user.channelName}"
- Título actual: "${user.title}"
- Descripción actual: """${(user.description || '').slice(0, 1500)}"""
- Etiquetas actuales: ${JSON.stringify(user.tags)}

REGLAS OBLIGATORIAS
1. Todas las opciones deben describir EXACTAMENTE este mismo video.
2. Prohibido convertirlo en guía, tutorial, lista, reseña, "cómo hacer", curso o cualquier formato distinto al original.
3. Prohibido inventar datos que no estén en el título, la descripción o las etiquetas del usuario (BPM, instrumentos, equipo, tracklist, colaboraciones, fechas, enlaces).
4. Escribe en ${lang}.
5. Entrega 6 títulos variados (máximo 100 caracteres, ideal ≤ 70). Cada uno con un enfoque distinto pero coherente con el video original.
6. Etiquetas: total ESTRICTAMENTE menor a 480 caracteres incluyendo comas; primero las propias del video, luego las que más repite la competencia.
7. Descripción: conserva todo lo que ya escribió el usuario y mejora las dos primeras líneas; 3 a 6 hashtags.${musicRules}

DATOS REALES DE LA COMPETENCIA (videos recientes y populares de otros canales)
${competitorLines || '(no hay datos de competencia disponibles)'}
Etiquetas más repetidas: ${topTags || '—'}

Devuelve ÚNICAMENTE JSON con esta estructura:
{
  "titles": [{ "style": string, "title": string, "whyItWorks": string, "includedKeywords": [string] }],
  "description": { "fullText": string, "firstTwoLinesSnippet": string, "suggestedHashtags": [string] },
  "tags": { "tagList": [string], "breakdown": { "primary": [string], "secondary": [string], "longTail": [string] } }
}`;

  try {
    const config: any = {
      responseMimeType: 'application/json',
      systemInstruction:
        'Eres un especialista en SEO de YouTube. Respetas siempre el tipo y el formato originales del video y devuelves JSON válido.',
    };
    if (args.enableThinking) config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };

    const response = await withTimeout(ai.models.generateContent({ model: MODEL, contents: prompt, config }), GEMINI_TIMEOUT_MS);
    return parseJson(response.text);
  } catch (err: any) {
    console.warn('Gemini no pudo generar sugerencias; se usan las locales:', err?.message);
    return null;
  }
}

/** Pide a Gemini (con búsqueda en Google) enlaces de videos parecidos. Se verifican después. */
export async function findCompetitorUrlsWithGemini(
  ai: GoogleGenAI,
  args: { user: UserVideoInput; profile: ContentProfile; query: string; count: number; days: number }
): Promise<string[]> {
  const { user, profile, query, count, days } = args;
  const prompt = `Busca en YouTube ${count + 4} videos REALES de OTROS canales (no del canal "${user.channelName}") parecidos a este:
- Tipo: ${describeProfile(profile)}
- Título: "${user.title}"
- Búsqueda sugerida: "${query}"

Requisitos: publicados en los últimos ${days} días, populares, y del mismo tipo y formato (no tutoriales ni guías si el original es música).
Devuelve SOLO JSON: { "videos": [{ "url": "https://www.youtube.com/watch?v=...", "title": string, "channel": string }] }
Usa únicamente enlaces que hayas encontrado de verdad; no inventes ninguno.`;

  try {
    const response = await withTimeout(
      ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] },
      }),
      GEMINI_TIMEOUT_MS
    );
    const text = response.text || '';
    const match = text.match(/\{[\s\S]*\}/);
    const data = match ? JSON.parse(match[0]) : null;
    const urls: string[] = Array.isArray(data?.videos) ? data.videos.map((v: any) => String(v?.url || '')) : [];
    return urls.filter(Boolean);
  } catch (err: any) {
    console.warn('Gemini no pudo proponer competidores:', err?.message);
    return [];
  }
}
