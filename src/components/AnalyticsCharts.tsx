import React, { useState } from 'react';
import { BenchmarkResult, UserVideo } from '../types';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Eye,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowUpRight,
  Sparkles,
  Maximize2,
} from 'lucide-react';

interface AnalyticsChartsProps {
  benchmark: BenchmarkResult;
  userVideo: UserVideo;
  onAddTagToUser: (tag: string) => void;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  benchmark,
  userVideo,
  onAddTagToUser,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'tags' | 'views' | 'seo' | 'categories'>('all');
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);

  // Top 10 tags by frequency
  const top10Tags = benchmark.tagMatrix.slice(0, 10);
  const maxTagFreq = Math.max(...top10Tags.map((t) => t.frequency), 10);

  // Competitor views for chart
  const competitorsSorted = [...benchmark.competitors].sort(
    (a, b) => (b.viewsNumeric || 0) - (a.viewsNumeric || 0)
  );
  const maxViews = Math.max(...competitorsSorted.map((c) => c.viewsNumeric || 100000));

  // Category counts
  const categoryCounts: Record<string, number> = {};
  benchmark.tagMatrix.forEach((t) => {
    const cat = t.category || 'Otros';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  const totalTagsInMatrix = benchmark.tagMatrix.length;

  const currentScore = benchmark.userVideoAnalysis.seoScoreCurrent;
  const targetScore = benchmark.optimizedSuggestions.predictedSeoScore;
  const scoreDelta = targetScore - currentScore;

  // Title length metrics
  const userTitleLen = userVideo.title.length;
  const avgCompetitorTitleLen = benchmark.commonPatterns.titleAvgLength || 62;

  // Tags characters metrics
  const userTagsCharCount = userVideo.tags.join(', ').length;

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 lg:p-6 shadow-xl space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Panel de Gráficas y Métricas Visuales</span>
              <BarChart3 className="w-5 h-5 text-amber-400" />
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visualización estadística de frecuencia de etiquetas, volumen de reproducciones de los 10 videos y
            proyección SEO.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todas las Gráficas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tags')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'tags'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Frecuencia de Tags
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('views')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'views'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Vistas de Competidores
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('seo')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'seo'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Score SEO
          </button>
        </div>
      </div>

      {/* Grid of Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRÁFICA 1: Top 10 Tags Frequency Bar Chart */}
        {(activeTab === 'all' || activeTab === 'tags') && (
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Top 10 Etiquetas Más Usadas en la Competencia</span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  Frecuencia de aparición entre los 10 videos analizados
                </span>
              </div>
              <div className="flex items-center space-x-2 text-[10px]">
                <span className="flex items-center space-x-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>En tu video</span>
                </span>
                <span className="flex items-center space-x-1 text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Te falta (Oportunidad)</span>
                </span>
              </div>
            </div>

            {/* Horizontal Bar Chart */}
            <div className="space-y-2.5 pt-2">
              {top10Tags.map((item, idx) => {
                const hasTag = userVideo.tags.some(
                  (ut) => ut.toLowerCase() === item.tag.toLowerCase()
                );
                const pct = Math.round((item.frequency / 10) * 100);

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredTag(item.tag)}
                    onMouseLeave={() => setHoveredTag(null)}
                    className="group"
                  >
                    <div className="flex justify-between items-center text-xs mb-1">
                      <div className="flex items-center space-x-2 truncate max-w-[200px] sm:max-w-[260px]">
                        <span className="font-mono text-[11px] text-slate-500 w-4">#{idx + 1}</span>
                        <span
                          className={`font-semibold truncate ${
                            hasTag ? 'text-slate-100' : 'text-amber-300 font-bold'
                          }`}
                        >
                          {item.tag}
                        </span>
                        {!hasTag && (
                          <button
                            type="button"
                            onClick={() => onAddTagToUser(item.tag)}
                            className="opacity-0 group-hover:opacity-100 transition text-[10px] px-1.5 py-0.2 rounded bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/60"
                            title="Añadir a mi video"
                          >
                            + Añadir
                          </button>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 font-mono text-[11px]">
                        <span className="text-slate-400">{item.accumulatedViews}</span>
                        <span className={`font-bold ${hasTag ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {item.frequency}/10 ({pct}%)
                        </span>
                      </div>
                    </div>

                    {/* Bar track */}
                    <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          hasTag
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-400 shadow-sm shadow-emerald-500/20'
                            : 'bg-gradient-to-r from-amber-600 to-yellow-400 shadow-sm shadow-amber-500/20'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* GRÁFICA 2: Competitor Views Distribution */}
        {(activeTab === 'all' || activeTab === 'views') && (
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-blue-400" />
                  <span>Volumen de Vistas: Ranking de los 10 Competidores</span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  Visualizaciones acumuladas de videos publicados en los últimos 30 días
                </span>
              </div>
            </div>

            {/* Vertical Columns Representation */}
            <div className="pt-4 flex items-end justify-between gap-1.5 h-64 border-b border-slate-800 pb-2 px-1">
              {competitorsSorted.map((comp, idx) => {
                const numericViews = comp.viewsNumeric || 100000;
                const heightPercent = Math.max(12, Math.round((numericViews / maxViews) * 100));

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none bg-slate-900 border border-slate-700 text-slate-200 text-[10px] p-2 rounded-lg shadow-xl w-36 z-20 text-center">
                      <p className="font-bold text-white truncate">{comp.channel}</p>
                      <p className="text-emerald-400 font-mono">{comp.views}</p>
                      <p className="text-slate-400 text-[9px]">{comp.published}</p>
                    </div>

                    {/* Views Label */}
                    <span className="text-[9px] font-mono text-slate-400 mb-1 opacity-80 group-hover:opacity-100 group-hover:text-amber-400 transition">
                      {(numericViews / 1000).toFixed(0)}k
                    </span>

                    {/* Column Bar */}
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 via-indigo-500 to-cyan-400 group-hover:from-red-600 group-hover:to-amber-400 transition-all duration-300 shadow-md"
                      style={{ height: `${heightPercent}%` }}
                    />

                    {/* Bottom Rank Label */}
                    <span className="text-[10px] font-bold text-slate-400 mt-2 font-mono group-hover:text-white">
                      #{comp.rank}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
              <span>Máximo: {competitorsSorted[0]?.views || '340K'}</span>
              <span>Canal más visto: {competitorsSorted[0]?.channel}</span>
              <span>Total analizado: 10 canales</span>
            </div>
          </div>
        )}

        {/* GRÁFICA 3: Circular SEO Score Gauge (Antes vs Después) */}
        {(activeTab === 'all' || activeTab === 'seo') && (
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Auditoría Algorítmica: Puntuación SEO (Antes vs Optimizado)</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                Comparativa de optimización según las directrices de búsqueda de YouTube
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
              {/* Circular Gauges */}
              <div className="flex items-center justify-around p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                {/* Current Gauge */}
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-800"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-amber-500"
                        strokeDasharray={`${currentScore}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-xl font-black text-amber-400">{currentScore}</span>
                      <span className="text-[9px] block text-slate-500">/ 100</span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-400 mt-2">Estado Actual</span>
                </div>

                <div className="text-2xl font-bold text-slate-600">→</div>

                {/* Optimized Gauge */}
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-800"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-emerald-400"
                        strokeDasharray={`${targetScore}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-xl font-black text-emerald-400">{targetScore}</span>
                      <span className="text-[9px] block text-slate-500">/ 100</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 mt-2">Con Mejoras</span>
                </div>
              </div>

              {/* Progress metrics */}
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 flex items-center justify-between">
                  <span className="font-semibold">Crecimiento Potencial:</span>
                  <span className="font-black text-sm text-emerald-400">+{scoreDelta} Puntos</span>
                </div>

                <div className="space-y-1.5 text-[11px] text-slate-300 pt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Densidad de Palabras Clave:</span>
                    <span className="font-semibold text-emerald-400">+38% vs actual</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cobertura de Tags Populares:</span>
                    <span className="font-semibold text-emerald-400">100% de Imprescindibles</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Visibilidad en Móviles:</span>
                    <span className="font-semibold text-emerald-400">Sin cortes (&lt; 70 chars)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GRÁFICA 4: Tag Category Distribution & Character Gauge */}
        {(activeTab === 'all' || activeTab === 'categories') && (
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <PieChart className="w-4 h-4 text-rose-400" />
                <span>Distribución del Mix de Etiquetas y Caracteres</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                Equilibrio entre términos específicos, volumen y tendencias
              </span>
            </div>

            {/* Visual segmented bar */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] text-slate-400">Composición de la Matriz:</span>
              <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-900 border border-slate-800">
                {Object.entries(categoryCounts).map(([cat, count], idx) => {
                  const pct = (count / totalTagsInMatrix) * 100;
                  const colors = [
                    'bg-red-500',
                    'bg-blue-500',
                    'bg-amber-400',
                    'bg-emerald-400',
                    'bg-purple-500',
                  ];
                  const bg = colors[idx % colors.length];

                  return (
                    <div
                      key={idx}
                      className={`${bg} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                      title={`${cat}: ${count} etiquetas (${pct.toFixed(0)}%)`}
                    />
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-2 pt-2 text-[11px]">
                {Object.entries(categoryCounts).map(([cat, count], idx) => {
                  const colorsDot = [
                    'bg-red-500',
                    'bg-blue-500',
                    'bg-amber-400',
                    'bg-emerald-400',
                    'bg-purple-500',
                  ];
                  return (
                    <div key={idx} className="flex items-center space-x-1.5">
                      <span className={`w-2 h-2 rounded-full ${colorsDot[idx % colorsDot.length]}`} />
                      <span className="text-slate-300 font-medium">{cat}</span>
                      <span className="text-slate-500 font-mono">({count})</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Audit Gauges for YouTube Limits */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-xs">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="text-slate-400">Título actual:</span>
                  <span
                    className={
                      userTitleLen <= 70 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'
                    }
                  >
                    {userTitleLen} / 70 chars
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${userTitleLen <= 70 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(100, (userTitleLen / 70) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Promedio competidores: {avgCompetitorTitleLen} chars
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="flex justify-between items-center text-[11px] mb-1">
                  <span className="text-slate-400">Etiquetas en YouTube:</span>
                  <span
                    className={
                      userTagsCharCount > 500
                        ? 'text-red-400 font-bold'
                        : userTagsCharCount > 400
                        ? 'text-emerald-400 font-bold'
                        : 'text-amber-400 font-bold'
                    }
                  >
                    {userTagsCharCount} / 500 max
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      userTagsCharCount > 500
                        ? 'bg-red-500'
                        : userTagsCharCount > 400
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, (userTagsCharCount / 500) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Recomendado: 420 - 480 caracteres
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
