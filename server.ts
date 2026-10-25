import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import type { ContentTypeOverride } from './src/types/index.ts';
import {
  extractYouTubeId,
  fetchYouTubeVideoMetadata,
  timeframeToMaxDays,
} from './server/youtube.ts';
import { detectContentProfile, parseMusicTitle } from './server/profile.ts';
import {
  assembleBenchmark,
  buildSearchQueries,
  computeCompetitorStats,
  normalizeSuggestions,
  type UserVideoInput,
} from './server/benchmark.ts';
import { collectCompetitors, competitorsFromUrls } from './server/competitors.ts';
import { findCompetitorUrlsWithGemini, generateSuggestionsWithGemini } from './server/gemini.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const hasGeminiKey = !!process.env.GEMINI_API_KEY;

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

function timeframeLabel(timeframe: string): string {
  if (timeframe === '2_weeks') return 'Últimas 2 semanas';
  if (timeframe === '3_months') return 'Últimos 3 meses';
  return 'Último mes (< 30 días)';
}

// Endpoint: Fetch YouTube video information from URL
app.post('/api/youtube/fetch-video', async (req, res) => {
  try {
    const { url, contentType } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Debes proporcionar una URL de YouTube válida.' });
    }

    const videoId = extractYouTubeId(url);
    if (!videoId) {
      return res.status(400).json({
        error: 'No se pudo reconocer un ID de video de YouTube válido en el enlace ingresado.',
      });
    }

    const videoData = await fetchYouTubeVideoMetadata(videoId);
    const contentProfile = detectContentProfile(
      {
        title: videoData.title,
        description: videoData.description,
        tags: videoData.tags,
        channelName: videoData.channelName,
        category: videoData.category,
      },
      (contentType as ContentTypeOverride) || 'auto'
    );
    return res.json({ ...videoData, contentProfile });
  } catch (err: any) {
    console.error('Error fetching youtube video:', err);
    return res.status(500).json({
      error: 'Error al obtener la información del video de YouTube: ' + (err.message || 'Error desconocido'),
    });
  }
});

// Endpoint: Benchmark contra videos reales + sugerencias que respetan el tipo de video
app.post('/api/analyze-and-benchmark', async (req, res) => {
  try {
    const {
      userVideo,
      customQuery,
      enableThinking = true,
      timeframe = '1_month',
      competitorCount = 10,
      contentType = 'auto',
    } = req.body;

    if (!userVideo || (!userVideo.title && !userVideo.description && !userVideo.tags?.length)) {
      return res.status(400).json({
        error: 'Por favor ingresa al menos el título o temática de tu video para poder analizar la competencia.',
      });
    }

    const userTags: string[] = Array.isArray(userVideo.tags)
      ? userVideo.tags.map((t: any) => String(t).trim()).filter(Boolean)
      : typeof userVideo.tags === 'string'
      ? userVideo.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      : [];

    const user: UserVideoInput = {
      title: String(userVideo.title || ''),
      description: String(userVideo.description || ''),
      tags: userTags,
      channelName: String(userVideo.channelName || ''),
      channelId: userVideo.channelId ? String(userVideo.channelId) : undefined,
      uploadDate: userVideo.uploadDate ? String(userVideo.uploadDate) : undefined,
    };
    const count = Math.max(3, Math.min(15, Number(competitorCount) || 10));

    // 1) ¿Qué tipo de video es? (música, género, formato, artista, canción)
    const profile = detectContentProfile(
      {
        title: user.title,
        description: user.description,
        tags: user.tags,
        channelName: user.channelName,
        category: userVideo.category,
      },
      contentType as ContentTypeOverride
    );
    const parsed =
      profile.kind === 'music'
        ? parseMusicTitle(user.title, user.channelName)
        : { artist: undefined, song: user.title, feat: undefined, extras: [] as string[] };

    // 2) Competidores reales de YouTube
    const queries = buildSearchQueries(user, profile, parsed, customQuery);
    const collectOpts = {
      queries,
      timeframe,
      count,
      ownChannelName: user.channelName,
      ownChannelId: user.channelId,
      ownVideoId: userVideo.videoId ? String(userVideo.videoId) : undefined,
    };

    let { raws, queryUsed } = await collectCompetitors(collectOpts);
    let dataSource: 'youtube' | 'gemini' | 'none' = raws.length > 0 ? 'youtube' : 'none';

    // 2b) Si YouTube no respondió, Gemini propone enlaces y se verifican uno a uno
    if (raws.length === 0 && hasGeminiKey) {
      const urls = await findCompetitorUrlsWithGemini(ai, {
        user,
        profile,
        query: queries[0] || user.title,
        count,
        days: timeframeToMaxDays(timeframe),
      });
      raws = await competitorsFromUrls(urls, collectOpts);
      if (raws.length > 0) {
        dataSource = 'gemini';
        queryUsed = queries[0] || user.title;
      }
    }

    // 3) Resultado base (todo calculado con datos reales)
    const warnings: string[] = [];
    if (raws.length === 0) {
      warnings.push(
        'No se pudieron leer videos competidores reales de YouTube en este intento (conexión o bloqueo temporal). ' +
          'Las sugerencias se basan solo en tu video; vuelve a intentarlo en unos minutos para ver la comparativa.'
      );
    } else if (raws.length < count) {
      warnings.push(`Solo se encontraron ${raws.length} videos recientes y populares que cumplan el filtro.`);
    }

    const result = assembleBenchmark({
      user,
      profile,
      parsed,
      raws,
      queryUsed: queryUsed || queries[0] || user.title,
      timeframeLabel: timeframeLabel(timeframe),
      dataSource,
      warnings,
    });

    // 4) Opcional: Gemini redacta las sugerencias (respetando el tipo de video)
    if (hasGeminiKey) {
      const competitors = result.competitors;
      const stats = computeCompetitorStats(raws);
      const candidate = await generateSuggestionsWithGemini(ai, {
        user,
        profile,
        competitors,
        matrix: result.tagMatrix,
        stats,
        enableThinking,
      });
      if (candidate) {
        const merged = normalizeSuggestions(
          candidate.optimizedSuggestions || candidate,
          result.optimizedSuggestions,
          result.tagMatrix,
          stats.avgTags
        );
        if (merged) result.optimizedSuggestions = merged;
      }
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Error in analyze-and-benchmark:', error);
    return res.status(500).json({
      error: error.message || 'Error interno al procesar el análisis de YouTube.',
    });
  }
});

// Endpoint: Multimodal Image / Thumbnail & Video understanding using Gemini
app.post('/api/analyze-multimodal', async (req, res) => {
  try {
    const { mediaBase64, mimeType, type, videoTopic } = req.body;

    if (!mediaBase64 || !mimeType) {
      return res.status(400).json({ error: 'Falta la imagen o archivo multimedia para analizar.' });
    }

    const mediaPart = {
      inlineData: {
        data: mediaBase64.replace(/^data:[^;]+;base64,/, ''),
        mimeType,
      },
    };

    const sameTypeRule = `REGLAS IMPORTANTES:
- Primero identifica QUÉ TIPO de contenido es realmente el archivo (por ejemplo: videoclip musical, lyric video, directo/concierto, DJ set, visualizer, tutorial, gameplay, vlog...). Devuélvelo en "detectedContentType".
- El título que indica el usuario ("${videoTopic || 'sin título'}") es solo una pista y puede no coincidir con el archivo. Si no coincide, guíate por lo que ves y oyes.
- Todas las recomendaciones deben MANTENER ese mismo tipo y formato de contenido. Está prohibido sugerir convertirlo en guía, tutorial, lista, reseña u otro formato distinto al original.
- Si es música, ofrece opciones variadas (enfoques de título, palabras clave, ganchos visuales) coherentes con la misma canción, artista, género y estilo visual.
- No inventes datos que no se vean ni se oigan en el archivo.`;

    let promptText = '';
    if (type === 'thumbnail' || mimeType.startsWith('image/')) {
      promptText = `Analiza esta miniatura de YouTube (Thumbnail).
${sameTypeRule}

Evalúa según los estándares de alto rendimiento de YouTube:
1. Impacto visual y contraste en dispositivos móviles (pantalla pequeña)
2. Legibilidad del texto (si tiene texto)
3. Expresión, foco principal y gancho de curiosidad
4. Tasa de clics (CTR) estimada: Puntuación de 1 a 100
5. 3 Recomendaciones específicas para destacar frente a otros videos del mismo tipo
6. 5 Palabras clave visuales o tags sugeridos basados en lo que muestra la imagen

Devuelve tu respuesta en JSON:
{
  "detectedContentType": string,
  "ctrScore": number,
  "summary": string,
  "strengths": [string],
  "improvements": [string],
  "visualTags": [string],
  "recommendations": [string]
}`;
    } else {
      promptText = `Analiza este fragmento/preview de video de YouTube.
${sameTypeRule}

Evalúa:
1. Gancho inicial (primeros 5 segundos)
2. Ritmo, dinamismo y retención estimada
3. Elementos clave del contenido que deben destacarse en el Título, Descripción y Etiquetas
4. 10 Etiquetas (tags) recomendadas extraídas directamente del contenido audiovisual
5. Resumen descriptivo para la descripción del video (sin cambiar el tipo de contenido)

Devuelve tu respuesta en JSON:
{
  "detectedContentType": string,
  "retentionScore": number,
  "summary": string,
  "detectedPacing": string,
  "contentHooks": [string],
  "suggestedTags": [string],
  "descriptionDraft": string
}`;
    }

    let result;
    try {
      // Try gemini-4-argon first as instructed in feature prompt, or gemini-3.8-flash as fallback
      result = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents: {
          parts: [mediaPart, { text: promptText }],
        },
        config: {
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        },
      });
    } catch (e4) {
      console.warn('gemini-4-argon failed, falling back to gemini-3.8-flash:', e4);
      result = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [mediaPart, { text: promptText }],
        },
        config: {
          responseMimeType: 'application/json',
        },
      });
    }

    const text = result.text || '{}';
    const cleaned = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleaned);

    return res.json(parsed);
  } catch (err: any) {
    console.error('Multimodal analysis error:', err);
    return res.status(500).json({ error: err.message || 'Error al analizar el contenido visual.' });
  }
});

// Configure Vite integration
async function setupVite() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
