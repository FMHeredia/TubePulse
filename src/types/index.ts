export interface UserVideo {
  title: string;
  description: string;
  tags: string[];
  channelName: string;
  url?: string;
  videoId?: string;
  thumbnail?: string;
  uploadDate?: string;
  viewCount?: string;
}

export interface CompetitorVideo {
  rank: number;
  title: string;
  channel: string;
  views: string;
  viewsNumeric?: number;
  published: string;
  url: string;
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
