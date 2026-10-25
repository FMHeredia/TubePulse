import React, { useState } from 'react';
import { OptimizedSuggestions, BenchmarkResult } from '../types';
import {
  Sparkles,
  Copy,
  Check,
  TrendingUp,
  Tag,
  FileText,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Send,
} from 'lucide-react';

interface GeneratedSuggestionsProps {
  suggestions: OptimizedSuggestions;
  currentSeoScore: number;
  onApplyTitle: (title: string) => void;
  onApplyDescription: (desc: string) => void;
  onApplyTags: (tags: string[]) => void;
}

export const GeneratedSuggestions: React.FC<GeneratedSuggestionsProps> = ({
  suggestions,
  currentSeoScore,
  onApplyTitle,
  onApplyDescription,
  onApplyTags,
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopyText = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(identifier);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const isOverLimit = suggestions.tags.totalCharacters > 500;

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 lg:p-6 shadow-xl space-y-6">
      {/* Header and Projected Score */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Paso 4: Sugerencias Optimizadas Basadas en Datos Populares</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Metadata generada a partir de los patrones, palabras clave y etiquetas con mejor rendimiento en los 10 videos
            competidores.
          </p>
        </div>

        {/* SEO Score Comparison Card */}
        <div className="flex items-center space-x-3 bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800">
          <div className="text-center">
            <span className="text-[10px] text-slate-400 block uppercase">Score Actual</span>
            <span className="text-lg font-bold text-amber-400">{currentSeoScore}</span>
            <span className="text-[10px] text-slate-500">/100</span>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-600" />

          <div className="text-center">
            <span className="text-[10px] text-emerald-400 font-semibold block uppercase">Con Mejoras</span>
            <span className="text-lg font-black text-emerald-400">
              {suggestions.predictedSeoScore}
            </span>
            <span className="text-[10px] text-slate-500">/100</span>
          </div>
        </div>
      </div>

      {/* 1. TITLE SUGGESTIONS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-red-400" />
            <span>Sugerencias de Título Optimizadas (4 Fórmulas Comprobadas)</span>
          </h3>
          <span className="text-[11px] text-slate-400">
            Optimizados para alta retención y visibilidad móvil (&lt; 70 caracteres)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {suggestions.titles.map((titleItem, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 transition flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider">
                    {titleItem.style}
                  </span>
                  <span
                    className={`text-[11px] font-mono ${
                      titleItem.characterCount <= 70 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {titleItem.characterCount} caracteres
                  </span>
                </div>

                <p className="text-sm font-semibold text-slate-100 leading-snug">
                  {titleItem.title}
                </p>

                <p className="text-xs text-slate-400">
                  <strong className="text-slate-300">Por qué funciona: </strong>
                  {titleItem.whyItWorks}
                </p>

                {/* Keywords included */}
                <div className="flex flex-wrap gap-1">
                  {titleItem.includedKeywords.map((kw, kIdx) => (
                    <span
                      key={kIdx}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => onApplyTitle(titleItem.title)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center space-x-1"
                >
                  <Send className="w-3 h-3 text-red-400" />
                  <span>Aplicar a mi Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyText(titleItem.title, `title-${idx}`)}
                  className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-semibold transition flex items-center space-x-1"
                >
                  {copiedSection === `title-${idx}` ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. MASTER TAGS PACK FOR YOUTUBE STUDIO */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-200">
              Pack Maestro de Etiquetas para YouTube Studio
            </h3>
          </div>

          {/* YouTube Limit Meter */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Total:</span>
            <span
              className={`font-mono font-bold ${
                isOverLimit ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {suggestions.tags.totalCharacters} / 500 caracteres
            </span>
            <span className="text-[10px] text-slate-500">(Límite estricto de YouTube)</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          {/* Main Copy Box */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="flex-1 p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 break-all select-all max-h-24 overflow-y-auto">
              {suggestions.tags.formattedCommaSeparated}
            </div>

            <div className="flex sm:flex-col gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  handleCopyText(suggestions.tags.formattedCommaSeparated, 'master-tags')
                }
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-red-600/30 transition"
              >
                {copiedSection === 'master-tags' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>¡Copiadas al Portapapeles!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Todas para YouTube Studio</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onApplyTags(suggestions.tags.tagList)}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition text-center"
              >
                Aplicar a Mi Video
              </button>
            </div>
          </div>

          {/* Breakdown tags by priority */}
          <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[11px] font-semibold text-red-400 block mb-1">
                Primarias (Nicho Imprescindible):
              </span>
              <div className="flex flex-wrap gap-1">
                {suggestions.tags.breakdown.primary.map((t, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded bg-red-950/40 text-red-200 border border-red-800/40"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-blue-400 block mb-1">
                Secundarias (Alto Volumen):
              </span>
              <div className="flex flex-wrap gap-1">
                {suggestions.tags.breakdown.secondary.map((t, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded bg-blue-950/40 text-blue-200 border border-blue-800/40"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-amber-400 block mb-1">
                Long-Tail (Específicas):
              </span>
              <div className="flex flex-wrap gap-1">
                {suggestions.tags.breakdown.longTail.map((t, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded bg-amber-950/40 text-amber-200 border border-amber-800/40"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. OPTIMIZED DESCRIPTION */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-200">
              Descripción Optimizada para Búsqueda y Retención
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => onApplyDescription(suggestions.description.fullText)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              Aplicar a mi Video
            </button>
            <button
              type="button"
              onClick={() => handleCopyText(suggestions.description.fullText, 'description')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition flex items-center space-x-1"
            >
              {copiedSection === 'description' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copiada</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Descripción</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* First 2 lines snippet highlight */}
        <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/30 space-y-1">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
            Snippet visible antes de 'Mostrar más' (Crucial para el CTR):
          </span>
          <p className="text-xs text-emerald-200 font-medium">
            "{suggestions.description.firstTwoLinesSnippet}"
          </p>
        </div>

        {/* Full description textarea view */}
        <div className="relative">
          <textarea
            readOnly
            rows={8}
            value={suggestions.description.fullText}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none"
          />
        </div>

        {/* Suggested Hashtags */}
        {suggestions.description.suggestedHashtags.length > 0 && (
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 font-semibold">Hashtags recomendados:</span>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.description.suggestedHashtags.map((ht, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-blue-950/50 text-blue-300 border border-blue-800/40 font-medium"
                >
                  {ht.startsWith('#') ? ht : `#${ht}`}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. STRATEGIC COMPETITOR ADVICE */}
      {suggestions.strategicAdvice && suggestions.strategicAdvice.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center space-x-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-200">
              Conclusiones Estratégicas y Brecha Competitiva
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestions.strategicAdvice.map((adv, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs"
              >
                <span className="font-bold text-amber-400 block">{adv.aspect}</span>
                <p className="text-slate-400">
                  <strong className="text-slate-300">Tendencia en los 10 mejores: </strong>
                  {adv.competitorTrend}
                </p>
                <p className="text-slate-200">
                  <strong className="text-emerald-400">Oportunidad para tu video: </strong>
                  {adv.actionableRecommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
