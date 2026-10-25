/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Header } from './components/Header';
import { VideoInputSection } from './components/VideoInputSection';
import { CompetitorsGrid } from './components/CompetitorsGrid';
import { TagMatrixTable } from './components/TagMatrixTable';
import { GeneratedSuggestions } from './components/GeneratedSuggestions';
import { ExportToolbar } from './components/ExportToolbar';
import { MultimodalModal } from './components/MultimodalModal';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { UserVideo, BenchmarkResult, ContentTypeOverride } from './types';
import { AlertCircle, FileSpreadsheet, CheckCircle, Music, Info } from 'lucide-react';

const EMPTY_VIDEO: UserVideo = {
  title: '',
  channelName: '',
  description: '',
  tags: [],
};

export default function App() {
  const [userVideo, setUserVideo] = useState<UserVideo>(EMPTY_VIDEO);

  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMultimodalOpen, setIsMultimodalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const chartsRef = useRef<HTMLDivElement>(null);

  const scrollToCharts = () => {
    chartsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAnalyze = async (
    customQuery?: string,
    enableThinking = true,
    timeframe = '1_month',
    contentType: ContentTypeOverride = 'auto'
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze-and-benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userVideo,
          customQuery,
          enableThinking,
          timeframe,
          competitorCount: 10,
          contentType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al ejecutar el análisis de YouTube.');
      }

      const data: BenchmarkResult = await response.json();
      setBenchmarkResult(data);
      const n = data.competitors.length;
      showToast(
        n > 0
          ? `¡Benchmark completado! Se analizaron ${n} videos reales de la competencia.`
          : 'Análisis completado, pero no se pudieron leer videos competidores.'
      );
    } catch (err: any) {
      console.error(err);
      setError(
        err.message ||
          'Ocurrió un error al conectar con YouTube y procesar los competidores. Por favor intenta de nuevo.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Tag manipulation from matrix table
  const handleAddTagToUser = (newTag: string) => {
    if (!userVideo.tags.includes(newTag)) {
      setUserVideo({
        ...userVideo,
        tags: [...userVideo.tags, newTag],
      });
      showToast(`Etiqueta "${newTag}" añadida a tu video.`);
    }
  };

  const handleAddMultipleTagsToUser = (newTags: string[]) => {
    const toAdd = newTags.filter((t) => !userVideo.tags.includes(t));
    if (toAdd.length > 0) {
      setUserVideo({
        ...userVideo,
        tags: [...userVideo.tags, ...toAdd],
      });
      showToast(`Se añadieron ${toAdd.length} etiquetas a tu video.`);
    }
  };

  // Applying suggestions
  const handleApplyTitle = (newTitle: string) => {
    setUserVideo({ ...userVideo, title: newTitle });
    showToast('Título aplicado a tu video.');
  };

  const handleApplyDescription = (newDesc: string) => {
    setUserVideo({ ...userVideo, description: newDesc });
    showToast('Descripción optimizada aplicada a tu video.');
  };

  const handleApplyTags = (newTags: string[]) => {
    setUserVideo({ ...userVideo, tags: newTags });
    showToast('Pack de etiquetas de YouTube Studio aplicado a tu video.');
  };

  const profile = benchmarkResult?.contentProfile;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Top Header */}
      <Header hasResults={!!benchmarkResult} onScrollToCharts={scrollToCharts} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Intro Hero Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 border border-red-900/30 p-6 shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                Auditoría Competitiva & Algoritmo de YouTube
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Supera a tu competencia con datos de los videos más populares del último mes
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Pega tu video o ingresa tu metadata. Buscaremos videos similares recientes (&lt; 30 días) de otros
                canales, extraeremos qué etiquetas y patrones tienen en común, y te generaremos la tabla comparativa
                en <strong>Excel</strong> y <strong>Notepad</strong> con gráficas interactivas y opciones de título
                que respetan el tipo de tu video.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <div className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Excel & Notepad</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 1: Input / Extraction Section */}
        <VideoInputSection
          userVideo={userVideo}
          onChangeUserVideo={setUserVideo}
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
          onOpenMultimodal={() => setIsMultimodalOpen(true)}
        />

        {/* Error notification if any */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/50 border border-red-800/80 text-xs text-red-300 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-red-200">Error en el análisis:</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Loading state indicator */}
        {isLoading && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-10 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin mx-auto" />
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white">
                Rastreando YouTube: buscando los videos más populares de la competencia
              </h3>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">
                Filtrando contenido de otros canales con menos de 1 mes de antigüedad, leyendo sus etiquetas reales,
                calculando la matriz de popularidad y preparando propuestas coherentes con tu video...
              </p>
            </div>
          </div>
        )}

        {/* Results Area */}
        {benchmarkResult && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* How the video was classified + warnings */}
            {profile && (
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-start space-x-3">
                <Music className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-slate-100">
                    Tipo de video detectado: {profile.kindLabel}
                    {profile.genre ? ` · ${profile.genre}` : ''}
                    {profile.format ? ` · ${profile.format}` : ''}
                    <span className="ml-2 text-[11px] font-normal text-slate-400">(confianza {profile.confidence})</span>
                  </p>
                  {profile.kind === 'music' && (profile.artist || profile.song) && (
                    <p className="text-slate-400">
                      Artista: <strong className="text-slate-200">{profile.artist || '—'}</strong> · Canción:{' '}
                      <strong className="text-slate-200">{profile.song || '—'}</strong>
                    </p>
                  )}
                  <p className="text-slate-400">
                    Todas las sugerencias mantienen este tipo de contenido. Si no es correcto, cambia «Tipo de video»
                    en el Paso 1 y vuelve a analizar.
                  </p>
                </div>
              </div>
            )}

            {benchmarkResult.warnings?.map((warning, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/50 text-xs text-amber-200 flex items-start space-x-3"
              >
                <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <p>{warning}</p>
              </div>
            ))}

            {/* Top Export Bar */}
            <ExportToolbar
              benchmark={benchmarkResult}
              userVideo={userVideo}
              onScrollToCharts={scrollToCharts}
            />

            {/* Visual Analytics & Charts Section */}
            <div ref={chartsRef} id="analytics-charts-section">
              <AnalyticsCharts
                benchmark={benchmarkResult}
                userVideo={userVideo}
                onAddTagToUser={handleAddTagToUser}
              />
            </div>

            {/* Step 2: Competitors Grid */}
            <CompetitorsGrid
              competitors={benchmarkResult.competitors}
              queryUsed={benchmarkResult.searchContext.queryUsed}
              timeframeLabel={benchmarkResult.searchContext.timeframe}
            />

            {/* Step 3: Comparative Tag Matrix Table */}
            <TagMatrixTable
              tagMatrix={benchmarkResult.tagMatrix}
              userTags={userVideo.tags}
              onAddTagToUser={handleAddTagToUser}
              onAddMultipleTagsToUser={handleAddMultipleTagsToUser}
            />

            {/* Step 4: Optimized Suggestions */}
            <GeneratedSuggestions
              suggestions={benchmarkResult.optimizedSuggestions}
              currentSeoScore={benchmarkResult.userVideoAnalysis.seoScoreCurrent}
              onApplyTitle={handleApplyTitle}
              onApplyDescription={handleApplyDescription}
              onApplyTags={handleApplyTags}
            />

            {/* Bottom Export Bar again for convenience */}
            <ExportToolbar
              benchmark={benchmarkResult}
              userVideo={userVideo}
              onScrollToCharts={scrollToCharts}
            />
          </div>
        )}
      </main>

      {/* Multimodal Modal */}
      <MultimodalModal
        isOpen={isMultimodalOpen}
        onClose={() => setIsMultimodalOpen(false)}
        videoTopic={userVideo.title}
        onApplyVisualTags={(tags) => handleAddMultipleTagsToUser(tags)}
        onApplyDescriptionDraft={(draft) => setUserVideo({ ...userVideo, description: draft })}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-emerald-500/50 text-slate-100 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 animate-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-600">
        <p>TubePulse © 2025-2026 • Análisis Competitivo de YouTube, Matriz de Etiquetas y Optimización de Metadata</p>
      </footer>
    </div>
  );
}
