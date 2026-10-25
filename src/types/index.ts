export interface UserVideo {
  title: string;
  description: string;
  tags: string[];
  channelName: string;
  channelId?: string;
  url?: string;
  videoId?: string;
  thumbnail?: string;
  uploadDate?: string;
  viewCount?: string;
  /** Categoría que YouTube asigna al video (ej. "Music"). Se rellena al extraer la URL. */
  category?: string;
  durationSeconds?: number;
}

/** Cómo se ha clasificado el video del usuario (se muestra en pantalla para que se pueda comprobar). */
export interface ContentProfile {
  kind: 'music' | 'general';
  kindLabel: string;
  /** Género musical detectado (solo música). */
  genre?: string;
  /** Formato detectado tal como aparece en el video (ej. "Official Video", "Lyric Video", "Live"). */
  format?: string;
  artist?: string;
  song?: string;
  language: 'es' | 'en';
  confidence: 'alta' | 'media' | 'baja';
  /** Pistas que llevaron a esta clasificación. */
  signals: string[];
  /** true si el usuario forzó el tipo manualmente. */
  manual?: boolean;
}

export type ContentTypeOverride = 'auto' | 'music' | 'general';

export interface CompetitorVideo {
  rank: number;
  title: string;
  channel: string;
  views: string;
  viewsNumeric?: number;
  published: string;
  url: string;
  videoId?: string;
  thumbnail?: string;
  tags: string[];
  descriptionSummary: string;
  keySuccessFactor: string;
}

export interface TagMatrixItem {
  tag: string;
  frequency: number;
  frequencyPercentage: number;
  videosUsing: string[];
  accumulatedViews: string;
  impactScore: number;
  category: 'Nicho Principal' | 'Alto Volumen' | 'Tendencia / Temporal' | 'Long-Tail' | string;
  recommendation: 'Imprescindible' | 'Muy Recomendada' | 'Opcional' | string;
  userHasTag: boolean;
}

export interface CommonPatterns {
  titleAvgLength: number;
  popularTitleWords: string[];
  popularFormulas: string[];
  descriptionPatterns: string[];
  hashtagsCommon: string[];
}

export interface SuggestedTitle {
  style: string;
  title: string;
  characterCount: number;
  whyItWorks: string;
  includedKeywords: string[];
}

export interface OptimizedSuggestions {
  predictedSeoScore: number;
  titles: SuggestedTitle[];
  description: {
    fullText: string;
    firstTwoLinesSnippet: string;
    suggestedTimestampsTemplate: string;
    suggestedHashtags: string[];
  };
  tags: {
    formattedCommaSeparated: string;
    totalCharacters: number;
    tagList: string[];
    breakdown: {
      primary: string[];
      secondary: string[];
      longTail: string[];
    };
  };
  strategicAdvice: Array<{
    aspect: string;
    competitorTrend: string;
    actionableRecommendation: string;
  }>;
}

export interface BenchmarkResult {
  searchContext: {
    queryUsed: string;
    timeframe: string;
    totalVideosAnalyzed: number;
  };
  /** Cómo se clasificó tu video (música, género, formato...). */
  contentProfile?: ContentProfile;
  /** De dónde salen los competidores: YouTube directo, Gemini con búsqueda, o ninguno. */
  dataSource?: 'youtube' | 'gemini' | 'none';
  /** Avisos para mostrar al usuario (por ejemplo, si no se pudieron obtener competidores reales). */
  warnings?: string[];
  userVideoAnalysis: {
    titleLength: number;
    tagsCount: number;
    tagsCharacterCount: number;
    strengths: string[];
    weaknesses: string[];
    seoScoreCurrent: number;
  };
  competitors: CompetitorVideo[];
  tagMatrix: TagMatrixItem[];
  commonPatterns: CommonPatterns;
  optimizedSuggestions: OptimizedSuggestions;
}

export interface MultimodalAnalysis {
  ctrScore?: number;
  retentionScore?: number;
  summary: string;
  /** Tipo de contenido que la IA reconoce en el archivo (ej. "Videoclip musical"). */
  detectedContentType?: string;
  strengths?: string[];
  weaknesses?: string[];
  improvements?: string[];
  contentHooks?: string[];
  visualTags?: string[];
  suggestedTags?: string[];
  recommendations?: string[];
  descriptionDraft?: string;
  detectedPacing?: string;
}
