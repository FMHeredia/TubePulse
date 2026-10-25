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
import { DownloadAppModal } from './components/DownloadAppModal';
import { UserVideo, BenchmarkResult } from './types';
import {
  TrendingUp,
  AlertCircle,
  Sparkles,
  Info,
  Youtube,
  FileSpreadsheet,
  FileText,
  CheckCircle,
  Download,
  BarChart2,
} from 'lucide-react';

export default function App() {
  const [userVideo, setUserVideo] = useState<UserVideo>({
    title: 'Melodic Techno Live Set 2025 | Deep Modular Synth & Underground Beats',
    channelName: 'PulseWave Music',
    description: `Sesión de música techno melódica grabada en directo con sintetizadores modulares analógicos y ritmos a 128 BPM.
Grabado en estudio para clubbing, sesiones nocturnas y concentración.

Tracklist:
00:00 Intro Atmospheric
04:20 Modular Drift
09:15 Neon Peak
16:40 Dark Outro

Suscríbete al canal para sesiones semanales de música electrónica underground.
#Techno #MelodicTechno #LiveSet`,
    tags: [
      'techno',
      'melodic techno',
      'techno mix 2025',
      'electronic music',
      'dark techno',
      'techno live set',
      'underground techno',
      'synthesizer session',
    ],
    thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
    uploadDate: '2025-10-15',
    viewCount: '2,340 vistas',
  });

  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMultimodalOpen, setIsMultimodalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
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
    timeframe = '1_month'
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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al ejecutar el análisis de YouTube.');
      }

      const data: BenchmarkResult = await response.json();
      setBenchmarkResult(data);
      showToast('¡Benchmark completado! Se analizaron 10 videos populares de la competencia.');
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Top Header */}
      <Header
        onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
        hasResults={!!benchmarkResult}
        onScrollToCharts={scrollToCharts}
      />

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
                Pega tu video o ingresa tu metadata. Buscaremos 10 videos similares recientes (&lt; 30 días) de otros
                canales, extraeremos qué etiquetas y patrones tienen en común, y te generaremos la tabla comparativa
                en <strong>Excel</strong> y <strong>Notepad</strong> con gráficas interactivas y títulos optimizados.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsDownloadModalOpen(true)}
                className="flex items-center space-x-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 px-3.5 py-2 rounded-xl shadow-lg shadow-red-600/30 transition transform hover:-translate-y-0.5"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Programa</span>
              </button>

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
                Rastreando YouTube: Buscando los 10 mejores videos de la competencia
              </h3>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">
                Filtrando contenido de otros canales con menos de 1 mes de antigüedad, calculando co-ocurrencia de
                etiquetas, matrices de popularidad, gráficas estadísticas y generando propuestas con IA...
              </p>
            </div>
          </div>
        )}

        {/* Results Area */}
        {benchmarkResult && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Top Export Bar */}
            <ExportToolbar
              benchmark={benchmarkResult}
              userVideo={userVideo}
              onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
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

            {/* Step 2: Competitors 10 Videos Grid */}
            <CompetitorsGrid
              competitors={benchmarkResult.competitors}
              queryUsed={benchmarkResult.searchContext.queryUsed}
            />

            {/* Step 3: Comparative Tag Matrix Table */}
            <TagMatrixTable
              tagMatrix={benchmarkResult.tagMatrix}
              userTags={userVideo.tags}
              onAddTagToUser={handleAddTagToUser}
              onAddMultipleTagsToUser={handleAddMultipleTagsToUser}
            />

            {/* Step 4: AI Optimized Suggestions */}
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
              onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
              onScrollToCharts={scrollToCharts}
            />
          </div>
        )}
      </main>

      {/* Multimodal Modal */}
      <MultimodalModal
        isOpen={isMultimodalOpen}
        onClose={() => setIsMultimodalOpen(false)}
        videoTopic={userVideo.title || 'Música tecno'}
        onApplyVisualTags={(tags) => handleAddMultipleTagsToUser(tags)}
        onApplyDescriptionDraft={(draft) => setUserVideo({ ...userVideo, description: draft })}
      />

      {/* Download Program Modal */}
      <DownloadAppModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
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
